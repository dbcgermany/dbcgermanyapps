import { createServerClient } from "@dbc/supabase/server";

const EVENT_LIST =
  "id, slug, title_en, title_de, title_fr, event_type, venue_name, city, starts_at, ends_at, cover_image_url" as const;

export async function getUpcomingEvents(limit = 3) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_LIST)
    .eq("is_published", true)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}
