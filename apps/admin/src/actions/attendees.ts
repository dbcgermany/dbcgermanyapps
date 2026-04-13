"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

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
