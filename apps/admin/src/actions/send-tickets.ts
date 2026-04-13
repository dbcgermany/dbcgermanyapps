"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendTicketEmail } from "@dbc/email";
import { revalidatePath } from "next/cache";

interface SingleSendInput {
  eventId: string;
  tierId: string;
  attendeeName: string;
  attendeeEmail: string;
  acquisitionType: "invited" | "assigned";
  locale: string;
}

interface BulkRecipient {
  name: string;
  email: string;
  tierName?: string;
}

async function sendSingleTicket(
  eventId: string,
  tierId: string,
  attendeeName: string,
  attendeeEmail: string,
  acquisitionType: "invited" | "assigned",
  locale: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  // Fetch event + tier in parallel
  const [eventRes, tierRes] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
      )
      .eq("id", eventId)
      .single(),
    supabase
      .from("ticket_tiers")
      .select("id, name_en, name_de, name_fr, price_cents, max_quantity, quantity_sold")
      .eq("id", tierId)
      .eq("event_id", eventId)
      .single(),
  ]);

  if (eventRes.error || !eventRes.data) {
    return { success: false, error: "Event not found" };
  }
  if (tierRes.error || !tierRes.data) {
    return { success: false, error: "Tier not found" };
  }

  const event = eventRes.data;
  const tier = tierRes.data;

  // Atomic reservation
  const { data: reserved } = await supabase.rpc("reserve_tickets", {
    p_tier_id: tierId,
    p_quantity: 1,
  });

  if (!reserved) {
    return { success: false, error: `"${tier.name_en}" is sold out` };
  }

  // Create order (comped, free)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      event_id: eventId,
      subtotal_cents: 0,
      discount_cents: 0,
      total_cents: 0,
      status: "comped",
      acquisition_type: acquisitionType,
      recipient_email: attendeeEmail,
      recipient_name: attendeeName,
      locale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: "Failed to create order" };
  }

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      order_id: order.id,
      event_id: eventId,
      tier_id: tierId,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
    })
    .select("id, ticket_token")
    .single();

  if (ticketError || !ticket) {
    return { success: false, error: "Failed to create ticket" };
  }

  // Send email synchronously (admin is waiting for confirmation)
  const localizedTitle =
    (event[`title_${locale}` as keyof typeof event] as string) || event.title_en;
  const localizedTierName =
    (tier[`name_${locale}` as keyof typeof tier] as string) || tier.name_en;

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  try {
    await sendTicketEmail({
      attendeeName,
      attendeeEmail,
      eventTitle: localizedTitle,
      eventType: event.event_type,
      startsAt: new Date(event.starts_at),
      endsAt: new Date(event.ends_at),
      venueName: event.venue_name ?? "",
      venueAddress: event.venue_address ?? "",
      city: event.city ?? "",
      timezone: event.timezone,
      tierName: localizedTierName,
      ticketToken: ticket.ticket_token,
      locale: locale as "en" | "de" | "fr",
      orderUrl: `${ticketsBaseUrl}/${locale}/confirmation/${order.id}`,
    });

    // Stamp as sent
    await supabase
      .from("tickets")
      .update({ pdf_url: `sent:${new Date().toISOString()}` })
      .eq("id", ticket.id);

    await supabase
      .from("orders")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", order.id);
  } catch (err) {
    console.error("Failed to send ticket email:", err);
    return { success: false, error: "Ticket created but email failed to send" };
  }

  // Audit log
  await supabase.from("audit_log").insert({
    user_id: actorId,
    action: acquisitionType === "invited" ? "invite_ticket" : "assign_ticket",
    entity_type: "tickets",
    entity_id: ticket.id,
    details: { attendee: attendeeName, tier: tier.name_en, event_id: eventId },
  });

  return { success: true };
}

export async function sendSingleTicketAction(input: SingleSendInput) {
  const user = await requireRole("manager");
  const result = await sendSingleTicket(
    input.eventId,
    input.tierId,
    input.attendeeName,
    input.attendeeEmail,
    input.acquisitionType,
    input.locale,
    user.userId
  );
  revalidatePath(`/${input.locale}/tickets/send`);
  return result;
}

export async function sendBulkTicketsAction(
  eventId: string,
  tierId: string,
  recipients: BulkRecipient[],
  locale: string
) {
  const user = await requireRole("manager");

  if (recipients.length > 500) {
    return { error: "Maximum 500 recipients per batch" };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    if (!recipient.name.trim() || !recipient.email.trim()) {
      failed += 1;
      continue;
    }

    const result = await sendSingleTicket(
      eventId,
      tierId,
      recipient.name.trim(),
      recipient.email.trim(),
      "invited",
      locale,
      user.userId
    );

    if (result.success) {
      sent += 1;
    } else {
      failed += 1;
      if (errors.length < 5 && result.error) {
        errors.push(`${recipient.email}: ${result.error}`);
      }
    }
  }

  revalidatePath(`/${locale}/tickets/send`);
  return { sent, failed, errors };
}

export async function getSendTicketsEvents() {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return data ?? [];
}

export async function getSendTicketsTiers(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr, max_quantity, quantity_sold")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}
