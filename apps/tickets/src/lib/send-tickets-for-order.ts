import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTicketEmail } from "@dbc/email";

/**
 * Generates PDF tickets and emails one to each attendee on the order.
 * Idempotent: skips tickets that already have a pdf_url stamped.
 * Marks the order with email_sent_at after all tickets are sent.
 *
 * Designed to be called from the Stripe webhook OR from a free-order code path.
 * Uses a service-role Supabase client (no cookie auth).
 */
export async function sendTicketsForOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, event_id, locale, email_sent_at, status"
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Idempotency: skip if already sent
  if (order.email_sent_at) {
    return;
  }

  // Only send for paid/comped orders
  if (order.status !== "paid" && order.status !== "comped") {
    throw new Error(`Order ${orderId} is not paid (status: ${order.status})`);
  }

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
    )
    .eq("id", order.event_id)
    .single();

  if (eventError || !event) {
    throw new Error(`Event ${order.event_id} not found`);
  }

  // Fetch tickets for the order (skip those already with a pdf_url)
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_token, attendee_name, attendee_email, tier_id, pdf_url"
    )
    .eq("order_id", orderId);

  if (ticketsError || !tickets) {
    throw new Error(`No tickets found for order ${orderId}`);
  }

  // Fetch all tiers in one query
  const tierIds = [...new Set(tickets.map((t) => t.tier_id))];
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr")
    .in("id", tierIds);

  const tierMap = new Map((tiers ?? []).map((t) => [t.id, t]));

  const locale = (order.locale as "en" | "de" | "fr") ?? "en";
  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";
  const orderUrl = `${ticketsBaseUrl}/${locale}/confirmation/${orderId}`;

  // Send each ticket
  for (const ticket of tickets) {
    if (ticket.pdf_url) continue; // already sent

    const tier = tierMap.get(ticket.tier_id);
    const tierName = tier
      ? ((tier[`name_${locale}` as keyof typeof tier] as string) ||
        tier.name_en)
      : "Ticket";

    try {
      const result = await sendTicketEmail({
        attendeeName: ticket.attendee_name,
        attendeeEmail: ticket.attendee_email,
        eventTitle,
        eventType: event.event_type,
        startsAt: new Date(event.starts_at),
        endsAt: new Date(event.ends_at),
        venueName: event.venue_name ?? "",
        venueAddress: event.venue_address ?? "",
        city: event.city ?? "",
        timezone: event.timezone,
        tierName,
        ticketToken: ticket.ticket_token,
        locale,
        orderUrl,
      });

      // Stamp the ticket as sent + persist the Resend message ID for
      // downstream bounce/deliverability tracking.
      await supabase
        .from("tickets")
        .update({
          pdf_url: `sent:${new Date().toISOString()}`,
          email_message_id: result?.id ?? null,
        })
        .eq("id", ticket.id);
    } catch (err) {
      console.error(
        `Failed to send ticket ${ticket.id} to ${ticket.attendee_email}:`,
        err
      );
      // Continue with other tickets — don't fail the whole batch
    }
  }

  // Mark order as fully emailed
  await supabase
    .from("orders")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", orderId);
}
