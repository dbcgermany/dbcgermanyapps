"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface AttendeeCategoryChip {
  slug: string;
  name_en: string;
  color: string | null;
}

export interface CrossEventAttendee {
  id: string;                        // ticket id
  contact_id: string | null;         // joined contact (null = legacy ticket)
  ticket_token: string;
  attendee_name: string;
  attendee_email: string;
  country: string | null;            // pulled from the joined contact
  categories: AttendeeCategoryChip[];
  marketing_consent: boolean;
  unsubscribed_at: string | null;
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
 * /contacts → Attendees tab. Joins each ticket to its underlying contact
 * so the table can render Country + Categories + Newsletter parity columns
 * with the Contacts tab, and each row can deep-link into the contact
 * profile when contact_id is present.
 */
export async function getAllAttendees(
  opts: { eventId?: string; marketingOnly?: boolean } = {}
): Promise<CrossEventAttendee[]> {
  await requireRole("manager");
  const supabase = await createServerClient();

  let query = supabase
    .from("tickets")
    .select(
      `id, ticket_token, attendee_name, attendee_email, contact_id,
       event_id, tier_id, checked_in_at, created_at, order_id,
       tier:ticket_tiers(name_en),
       event:events(title_en, starts_at),
       order:orders(acquisition_type),
       contact:contacts(
         id, country, marketing_consent, unsubscribed_at,
         links:contact_category_links(
           category:contact_categories(slug, name_en, color)
         )
       )`
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (opts.eventId) query = query.eq("event_id", opts.eventId);

  const { data } = await query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = (Array.isArray(t.contact) ? t.contact[0] : t.contact) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories: AttendeeCategoryChip[] = ((contact?.links ?? []) as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => l.category)
      .filter(Boolean);
    return {
      id: t.id,
      contact_id: contact?.id ?? t.contact_id ?? null,
      ticket_token: t.ticket_token,
      attendee_name: t.attendee_name,
      attendee_email: t.attendee_email,
      country: contact?.country ?? null,
      categories,
      marketing_consent: Boolean(contact?.marketing_consent),
      unsubscribed_at: contact?.unsubscribed_at ?? null,
      event_id: t.event_id,
      event_title: t.event?.title_en ?? "",
      event_starts_at: t.event?.starts_at ?? "",
      tier_name: t.tier?.name_en ?? "Ticket",
      acquisition_type: t.order?.acquisition_type ?? "purchased",
      checked_in_at: t.checked_in_at,
      created_at: t.created_at,
    };
  });

  if (opts.marketingOnly) {
    return rows.filter(
      (r) => r.marketing_consent && !r.unsubscribed_at
    );
  }
  return rows;
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
