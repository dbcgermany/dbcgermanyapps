import { createServerClient } from "@dbc/supabase/server";

const EVENT_PUBLIC_LIST =
  "id, slug, title_en, title_de, title_fr, event_type, venue_name, city, starts_at, ends_at, cover_image_url" as const;

const EVENT_PUBLIC_DETAIL =
  "id, slug, title_en, title_de, title_fr, description_en, description_de, description_fr, event_type, venue_name, venue_address, city, country, timezone, starts_at, ends_at, max_tickets_per_order, enabled_payment_methods, cover_image_url, seo_title, seo_description, og_image_url, hero_video_url, hero_overlay_image_url, hero_overlay_text_en, hero_overlay_text_de, hero_overlay_text_fr, hero_darkening_strength, funnel_tagline_en, funnel_tagline_de, funnel_tagline_fr, funnel_intro_en, funnel_intro_de, funnel_intro_fr, funnel_closing_en, funnel_closing_de, funnel_closing_fr, scarcity_threshold" as const;

const TIER_PUBLIC =
  "id, slug, name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, original_price_cents, currency, max_quantity, quantity_sold, sales_start_at, sales_end_at, sort_order" as const;

const SCHEDULE_PUBLIC =
  "id, title_en, title_de, title_fr, description_en, description_de, description_fr, starts_at, ends_at, speaker_name, speaker_title, speaker_image_url, speaker_id, sort_order" as const;

const SPEAKER_PUBLIC =
  "id, slug, first_name, last_name, title_en, title_de, title_fr, company_en, company_de, company_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url, twitter_url, website_url, team_member_id" as const;

// Pulled when a speaker has team_member_id set so the public profile can
// inherit bio/photo/role/contact from the canonical team_members row.
// Speakers row fields take precedence when filled — team_members is only
// the fallback. Same pattern as how the team profile page already renders.
const TEAM_MEMBER_FOR_SPEAKER =
  "id, slug, name, role_en, role_de, role_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url, visibility" as const;

const EVENT_SPEAKER_PUBLIC =
  "speaker_id, role_label_en, role_label_de, role_label_fr, is_featured, sort_order" as const;

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

export type PublicTeamMemberFallback = {
  id: string;
  slug: string;
  name: string;
  role_en: string | null;
  role_de: string | null;
  role_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  photo_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  visibility: string;
};

export type PublicEventSpeaker = {
  speaker_id: string;
  role_label_en: string | null;
  role_label_de: string | null;
  role_label_fr: string | null;
  is_featured: boolean;
  sort_order: number;
  speakers: {
    id: string;
    slug: string;
    first_name: string;
    last_name: string;
    title_en: string | null;
    title_de: string | null;
    title_fr: string | null;
    company_en: string | null;
    company_de: string | null;
    company_fr: string | null;
    bio_en: string | null;
    bio_de: string | null;
    bio_fr: string | null;
    photo_url: string | null;
    email: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    website_url: string | null;
    team_member_id: string | null;
    team_members: PublicTeamMemberFallback | null;
  };
};

export async function getEventSpeakers(eventId: string): Promise<PublicEventSpeaker[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_speakers")
    .select(
      `${EVENT_SPEAKER_PUBLIC}, speakers!inner(${SPEAKER_PUBLIC}, team_members(${TEAM_MEMBER_FOR_SPEAKER}))`,
    )
    .eq("event_id", eventId)
    .eq("speakers.visibility", "public")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicEventSpeaker[];
}

export async function getEventSpeakerBySlug(
  eventId: string,
  speakerSlug: string,
): Promise<PublicEventSpeaker | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_speakers")
    .select(
      `${EVENT_SPEAKER_PUBLIC}, speakers!inner(${SPEAKER_PUBLIC}, team_members(${TEAM_MEMBER_FOR_SPEAKER}))`,
    )
    .eq("event_id", eventId)
    .eq("speakers.slug", speakerSlug)
    .eq("speakers.visibility", "public")
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as unknown as PublicEventSpeaker | null;
}

export type PublicPillar = {
  id: string;
  icon: string | null;
  title_en: string;
  title_de: string | null;
  title_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  sort_order: number;
};

export async function getEventPillars(eventId: string): Promise<PublicPillar[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_pillars")
    .select("id, icon, title_en, title_de, title_fr, description_en, description_de, description_fr, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as PublicPillar[];
}

export type PublicTestimonial = {
  id: string;
  author_name: string;
  author_role_en: string | null;
  author_role_de: string | null;
  author_role_fr: string | null;
  author_photo_url: string | null;
  quote_en: string;
  quote_de: string | null;
  quote_fr: string | null;
  video_url: string | null;
  rating: number | null;
  is_featured: boolean;
  sort_order: number;
  source_url: string | null;
  source_label: string | null;
};

const TESTIMONIAL_COLUMNS =
  "id, author_name, author_role_en, author_role_de, author_role_fr, author_photo_url, quote_en, quote_de, quote_fr, video_url, rating, is_featured, sort_order, source_url, source_label";

export async function getEventTestimonials(
  eventId: string,
  limit = 3,
): Promise<PublicTestimonial[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_testimonials")
    .select(TESTIMONIAL_COLUMNS)
    .eq("event_id", eventId)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as PublicTestimonial[];
}

export async function getSiteTestimonials(limit = 3): Promise<PublicTestimonial[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("site_testimonials")
    .select(TESTIMONIAL_COLUMNS)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as PublicTestimonial[];
}

export type PublicFaq = {
  id: string;
  question_en: string;
  question_de: string | null;
  question_fr: string | null;
  answer_en: string;
  answer_de: string | null;
  answer_fr: string | null;
  sort_order: number;
};

export async function getEventFaqs(eventId: string): Promise<PublicFaq[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_faqs")
    .select("id, question_en, question_de, question_fr, answer_en, answer_de, answer_fr, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as PublicFaq[];
}
