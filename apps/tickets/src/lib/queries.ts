import { createServerClient } from "@dbc/supabase/server";

const EVENT_PUBLIC_LIST =
  "id, slug, title_en, title_de, title_fr, event_type, venue_name, city, starts_at, ends_at, capacity, cover_image_url" as const;

const EVENT_PUBLIC_DETAIL =
  "id, slug, title_en, title_de, title_fr, description_en, description_de, description_fr, event_type, venue_name, venue_address, city, country, timezone, starts_at, ends_at, capacity, max_tickets_per_order, enabled_payment_methods, cover_image_url" as const;

const TIER_PUBLIC =
  "id, name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, currency, max_quantity, quantity_sold, sales_start_at, sales_end_at, sort_order" as const;

const SCHEDULE_PUBLIC =
  "id, title_en, title_de, title_fr, description_en, description_de, description_fr, starts_at, ends_at, speaker_name, speaker_title, speaker_image_url, sort_order" as const;

export async function getPublishedEvents() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_PUBLIC_LIST)
    .eq("is_published", true)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEventBySlug(slug: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_PUBLIC_DETAIL)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data;
}

export async function getPublicTiers(eventId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("ticket_tiers")
    .select(TIER_PUBLIC)
    .eq("event_id", eventId)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEventSchedule(eventId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_schedule_items")
    .select(SCHEDULE_PUBLIC)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEventMedia(eventId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_media")
    .select("id, type, url, title, sort_order, created_at")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
