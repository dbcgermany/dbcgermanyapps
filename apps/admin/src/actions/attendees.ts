"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface CrossEventAttendee {
  id: string;
  ticket_token: string;
  attendee_name: string;
  attendee_email: string;
  event_id: string;
  event_title: string;
  event_starts_at: string;
  tier_name: string;
  acquisition_type: string;
  checked_in_at: string | null;
  created_at: string;
}

/**
 * List attendees across all events (or scoped to one event), for the
 * /contacts → Attendees tab. Lighter than getEventAttendees: skips notes
 * and the per-event scope, includes the event title so the table can
 * stay sortable across events.
 */
export async function getAllAttendees(
  opts: { eventId?: string } = {}
): Promise<CrossEventAttendee[]> {
  await requireRole("manager");
  const supabase = await createServerClient();

  let query = supabase
    .from("tickets")
    .select(
      `id, ticket_token, attendee_name, attendee_email, event_id, tier_id,
       checked_in_at, created_at, order_id,
       tier:ticket_tiers(name_en),
       event:events(title_en, starts_at),
       order:orders(acquisition_type)`
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (opts.eventId) query = query.eq("event_id", opts.eventId);

  const { data } = await query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((t) => ({
    id: t.id,
    ticket_token: t.ticket_token,
    attendee_name: t.attendee_name,
    attendee_email: t.attendee_email,
    event_id: t.event_id,
    event_title: t.event?.title_en ?? "",
    event_starts_at: t.event?.starts_at ?? "",
    tier_name: t.tier?.name_en ?? "Ticket",
    acquisition_type: t.order?.acquisition_type ?? "purchased",
    checked_in_at: t.checked_in_at,
    created_at: t.created_at,
  }));
}

export async function getEventAttendees(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, ticket_token, attendee_name, attendee_email, tier_id, checked_in_at, notes, created_at, order_id"
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Enrich with tier names + order acquisition_type
  const tierIds = [...new Set((data ?? []).map((t) => t.tier_id))];
  const orderIds = [...new Set((data ?? []).map((t) => t.order_id))];

  const [tiersRes, ordersRes] = await Promise.all([
    supabase
      .from("ticket_tiers")
      .select("id, name_en, name_de, name_fr")
      .in("id", tierIds),
    supabase
      .from("orders")
      .select("id, acquisition_type, status")
      .in("id", orderIds),
  ]);

  const tierMap = new Map(
    (tiersRes.data ?? []).map((t) => [t.id, t])
  );
  const orderMap = new Map(
    (ordersRes.data ?? []).map((o) => [o.id, o])
  );

  return (data ?? []).map((t) => ({
    ...t,
    tier: tierMap.get(t.tier_id) ?? null,
    order: orderMap.get(t.order_id) ?? null,
  }));
}

export async function updateAttendeeNotes(
  ticketId: string,
  notes: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("tickets")
    .update({ notes })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_ticket_notes",
    entity_type: "tickets",
    entity_id: ticketId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/attendees`);
  return { success: true };
}
