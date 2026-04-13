"use server";

import { createServerClient } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendTicketEmail, sendTransferConfirmation } from "@dbc/email";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { randomUUID } from "crypto";

interface TransferInput {
  ticketId: string;
  newAttendeeName: string;
  newAttendeeEmail: string;
  locale: string;
}

/**
 * Transfers a ticket to a new attendee:
 * 1. Rotates ticket_token (the OLD QR code becomes invalid — crucial for security)
 * 2. Updates attendee name/email
 * 3. Sets is_transferred = true
 * 4. Re-sends the PDF to the new attendee (async, via `after()`)
 *
 * Rules:
 * - Only the buyer (order.buyer_id) can transfer their own ticket
 * - Cannot transfer a ticket that's already been checked in
 * - Cannot transfer if event has already ended
 */
export async function transferTicket(input: TransferInput) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to transfer a ticket." };
  }

  if (!input.newAttendeeName.trim() || !input.newAttendeeEmail.trim()) {
    return { error: "New attendee name and email are required." };
  }

  // Fetch ticket + order + event
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_token, attendee_name, attendee_email, tier_id, event_id, checked_in_at, is_transferred, order_id"
    )
    .eq("id", input.ticketId)
    .single();

  if (ticketError || !ticket) {
    return { error: "Ticket not found." };
  }

  if (ticket.checked_in_at) {
    return { error: "This ticket has already been used for check-in." };
  }

  // Verify ownership via the order
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id")
    .eq("id", ticket.order_id)
    .single();

  if (!order || order.buyer_id !== user.id) {
    return { error: "You do not own this ticket." };
  }

  // Fetch event to check end time
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
    )
    .eq("id", ticket.event_id)
    .single();

  if (!event) {
    return { error: "Event not found." };
  }

  if (new Date(event.ends_at) < new Date()) {
    return { error: "Cannot transfer a ticket for a past event." };
  }

  // Fetch tier for email
  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("name_en, name_de, name_fr")
    .eq("id", ticket.tier_id)
    .single();

  // Atomic update: rotate token + update attendee + mark transferred
  const newToken = randomUUID();

  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      ticket_token: newToken,
      attendee_name: input.newAttendeeName.trim(),
      attendee_email: input.newAttendeeEmail.trim(),
      is_transferred: true,
      pdf_url: null, // Clear so re-send path doesn't skip it
    })
    .eq("id", input.ticketId)
    .is("checked_in_at", null); // Only if still not checked in

  if (updateError) {
    return { error: "Failed to transfer ticket. Please try again." };
  }

  // Audit log (via service client so it works even if buyer session expires)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await serviceClient.from("audit_log").insert({
    user_id: user.id,
    action: "transfer_ticket",
    entity_type: "tickets",
    entity_id: input.ticketId,
    details: {
      from: ticket.attendee_name,
      to: input.newAttendeeName,
      event_id: ticket.event_id,
    },
  });

  // Send new ticket PDF via email (async — don't block the UI response)
  const locale = input.locale as "en" | "de" | "fr";
  const localizedTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;
  const localizedTierName = tier
    ? ((tier[`name_${locale}` as keyof typeof tier] as string) || tier.name_en)
    : "Ticket";
  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  after(async () => {
    // 1. Send the notification that the ticket was transferred.
    try {
      const startsAtDate = new Date(event.starts_at);
      const endsAtDate = new Date(event.ends_at);
      await sendTransferConfirmation({
        to: input.newAttendeeEmail.trim(),
        recipientName: input.newAttendeeName.trim(),
        previousHolderName: ticket.attendee_name,
        eventTitle: localizedTitle,
        eventDate: startsAtDate.toLocaleDateString(locale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        eventTime: `${startsAtDate.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })} \u2013 ${endsAtDate.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        venueName: event.venue_name ?? "",
        tierName: localizedTierName,
        ticketShortId: newToken.slice(0, 8).toUpperCase(),
        orderUrl: `${ticketsBaseUrl}/${locale}/confirmation/${ticket.order_id}`,
        locale,
      });
    } catch (err) {
      console.error("Failed to send transfer confirmation email:", err);
    }

    // 2. Send the actual PDF ticket (fresh QR code + ticket attachment).
    try {
      await sendTicketEmail({
        attendeeName: input.newAttendeeName.trim(),
        attendeeEmail: input.newAttendeeEmail.trim(),
        eventTitle: localizedTitle,
        eventType: event.event_type,
        startsAt: new Date(event.starts_at),
        endsAt: new Date(event.ends_at),
        venueName: event.venue_name ?? "",
        venueAddress: event.venue_address ?? "",
        city: event.city ?? "",
        timezone: event.timezone,
        tierName: localizedTierName,
        ticketToken: newToken,
        locale,
        orderUrl: `${ticketsBaseUrl}/${locale}/confirmation/${ticket.order_id}`,
      });

      await serviceClient
        .from("tickets")
        .update({ pdf_url: `sent:${new Date().toISOString()}` })
        .eq("id", input.ticketId);
    } catch (err) {
      console.error("Failed to send transferred ticket email:", err);
    }
  });

  revalidatePath(`/${input.locale}/orders`);
  revalidatePath(`/${input.locale}/confirmation/${ticket.order_id}`);
  return { success: true };
}
