"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { pingRevalidate } from "@/lib/revalidate";

// Funnel content lives on the event page as data-gated sections (pillars,
// testimonials, FAQs) plus a few trilingual copy fields on the events row
// (intro, closing, hero video, tagline, scarcity threshold). Every CRUD
// action here mirrors the sponsors-client pattern: server actions guarded
// by requireRole("manager"), audit-logged, and pings tickets ISR.

function ticketsPathsForEvent(eventSlug?: string | null) {
  const paths = ["/[locale]/events"];
  if (eventSlug) {
    paths.push(`/[locale]/events/${eventSlug}`);
    paths.push(`/[locale]/events/${eventSlug}/speakers`);
  }
  return paths;
}

async function getEventSlug(eventId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single();
  return data?.slug ?? null;
}

// ---------------------------------------------------------------------------
// Pillars ("What you take home")
// ---------------------------------------------------------------------------

export interface EventPillar {
  id: string;
  event_id: string;
  icon: string | null;
  title_en: string;
  title_de: string | null;
  title_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  sort_order: number;
}

export async function getPillarsForEvent(
  eventId: string,
): Promise<EventPillar[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_pillars")
    .select(
      "id, event_id, icon, title_en, title_de, title_fr, description_en, description_de, description_fr, sort_order",
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EventPillar[];
}

function readPillarForm(formData: FormData) {
  return {
    icon: ((formData.get("icon") as string) || "").trim() || null,
    title_en: ((formData.get("title_en") as string) || "").trim(),
    title_de: ((formData.get("title_de") as string) || "").trim() || null,
    title_fr: ((formData.get("title_fr") as string) || "").trim() || null,
    description_en:
      ((formData.get("description_en") as string) || "").trim() || null,
    description_de:
      ((formData.get("description_de") as string) || "").trim() || null,
    description_fr:
      ((formData.get("description_fr") as string) || "").trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "100", 10),
  };
}

export async function createPillar(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readPillarForm(formData);
  if (!fields.title_en) return { error: "English title is required." };
  const { error } = await supabase
    .from("event_pillars")
    .insert({ event_id: eventId, ...fields });
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_pillar",
    entity_type: "event_pillars",
    entity_id: eventId,
    details: { title: fields.title_en },
  });
  const slug = await getEventSlug(eventId);
  revalidatePath(`/${formData.get("locale") || "en"}/events/${eventId}/funnel`);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}

export async function updatePillar(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readPillarForm(formData);
  if (!fields.title_en) return { error: "English title is required." };
  const { data: existing } = await supabase
    .from("event_pillars")
    .select("event_id")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("event_pillars")
    .update(fields)
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_pillar",
    entity_type: "event_pillars",
    entity_id: id,
    details: { title: fields.title_en },
  });
  if (existing?.event_id) {
    const slug = await getEventSlug(existing.event_id);
    await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  }
  return { success: true };
}

export async function deletePillar(id: string, eventId: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase.from("event_pillars").delete().eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_pillar",
    entity_type: "event_pillars",
    entity_id: id,
    details: {},
  });
  const slug = await getEventSlug(eventId);
  revalidatePath(`/${locale}/events/${eventId}/funnel`);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export interface EventTestimonial {
  id: string;
  event_id: string;
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
}

export async function getTestimonialsForEvent(
  eventId: string,
): Promise<EventTestimonial[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_testimonials")
    .select(
      "id, event_id, author_name, author_role_en, author_role_de, author_role_fr, author_photo_url, quote_en, quote_de, quote_fr, video_url, rating, is_featured, sort_order",
    )
    .eq("event_id", eventId)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EventTestimonial[];
}

function readTestimonialForm(formData: FormData) {
  const rawRating = ((formData.get("rating") as string) || "").trim();
  const rating = rawRating ? parseInt(rawRating, 10) : null;
  return {
    author_name: ((formData.get("author_name") as string) || "").trim(),
    author_role_en:
      ((formData.get("author_role_en") as string) || "").trim() || null,
    author_role_de:
      ((formData.get("author_role_de") as string) || "").trim() || null,
    author_role_fr:
      ((formData.get("author_role_fr") as string) || "").trim() || null,
    author_photo_url:
      ((formData.get("author_photo_url") as string) || "").trim() || null,
    quote_en: ((formData.get("quote_en") as string) || "").trim(),
    quote_de: ((formData.get("quote_de") as string) || "").trim() || null,
    quote_fr: ((formData.get("quote_fr") as string) || "").trim() || null,
    video_url: ((formData.get("video_url") as string) || "").trim() || null,
    rating: rating != null && rating >= 1 && rating <= 5 ? rating : null,
    is_featured: formData.get("is_featured") === "on",
    sort_order: parseInt((formData.get("sort_order") as string) || "100", 10),
  };
}

export async function createTestimonial(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readTestimonialForm(formData);
  if (!fields.author_name || !fields.quote_en) {
    return { error: "Author name and English quote are required." };
  }
  const { error } = await supabase
    .from("event_testimonials")
    .insert({ event_id: eventId, ...fields });
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_testimonial",
    entity_type: "event_testimonials",
    entity_id: eventId,
    details: { author: fields.author_name },
  });
  const slug = await getEventSlug(eventId);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}

export async function updateTestimonial(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readTestimonialForm(formData);
  if (!fields.author_name || !fields.quote_en) {
    return { error: "Author name and English quote are required." };
  }
  const { data: existing } = await supabase
    .from("event_testimonials")
    .select("event_id")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("event_testimonials")
    .update(fields)
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_testimonial",
    entity_type: "event_testimonials",
    entity_id: id,
    details: { author: fields.author_name },
  });
  if (existing?.event_id) {
    const slug = await getEventSlug(existing.event_id);
    await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  }
  return { success: true };
}

export async function deleteTestimonial(
  id: string,
  eventId: string,
  locale: string,
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("event_testimonials")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_testimonial",
    entity_type: "event_testimonials",
    entity_id: id,
    details: {},
  });
  const slug = await getEventSlug(eventId);
  revalidatePath(`/${locale}/events/${eventId}/funnel`);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export interface EventFaq {
  id: string;
  event_id: string;
  question_en: string;
  question_de: string | null;
  question_fr: string | null;
  answer_en: string;
  answer_de: string | null;
  answer_fr: string | null;
  sort_order: number;
}

export async function getFaqsForEvent(eventId: string): Promise<EventFaq[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_faqs")
    .select(
      "id, event_id, question_en, question_de, question_fr, answer_en, answer_de, answer_fr, sort_order",
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EventFaq[];
}

function readFaqForm(formData: FormData) {
  return {
    question_en: ((formData.get("question_en") as string) || "").trim(),
    question_de: ((formData.get("question_de") as string) || "").trim() || null,
    question_fr: ((formData.get("question_fr") as string) || "").trim() || null,
    answer_en: ((formData.get("answer_en") as string) || "").trim(),
    answer_de: ((formData.get("answer_de") as string) || "").trim() || null,
    answer_fr: ((formData.get("answer_fr") as string) || "").trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "100", 10),
  };
}

export async function createFaq(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readFaqForm(formData);
  if (!fields.question_en || !fields.answer_en) {
    return { error: "English question and answer are required." };
  }
  const { error } = await supabase
    .from("event_faqs")
    .insert({ event_id: eventId, ...fields });
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_faq",
    entity_type: "event_faqs",
    entity_id: eventId,
    details: { question: fields.question_en },
  });
  const slug = await getEventSlug(eventId);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}

export async function updateFaq(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readFaqForm(formData);
  if (!fields.question_en || !fields.answer_en) {
    return { error: "English question and answer are required." };
  }
  const { data: existing } = await supabase
    .from("event_faqs")
    .select("event_id")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("event_faqs").update(fields).eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_faq",
    entity_type: "event_faqs",
    entity_id: id,
    details: { question: fields.question_en },
  });
  if (existing?.event_id) {
    const slug = await getEventSlug(existing.event_id);
    await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  }
  return { success: true };
}

export async function deleteFaq(id: string, eventId: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase.from("event_faqs").delete().eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_faq",
    entity_type: "event_faqs",
    entity_id: id,
    details: {},
  });
  const slug = await getEventSlug(eventId);
  revalidatePath(`/${locale}/events/${eventId}/funnel`);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}

// ---------------------------------------------------------------------------
// Event funnel copy (intro, closing, video, tagline, scarcity threshold)
// ---------------------------------------------------------------------------

export interface EventFunnelCopy {
  hero_video_url: string | null;
  funnel_tagline_en: string | null;
  funnel_tagline_de: string | null;
  funnel_tagline_fr: string | null;
  funnel_intro_en: string | null;
  funnel_intro_de: string | null;
  funnel_intro_fr: string | null;
  funnel_closing_en: string | null;
  funnel_closing_de: string | null;
  funnel_closing_fr: string | null;
  scarcity_threshold: number;
}

export async function getEventFunnelCopy(
  eventId: string,
): Promise<EventFunnelCopy> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "hero_video_url, funnel_tagline_en, funnel_tagline_de, funnel_tagline_fr, funnel_intro_en, funnel_intro_de, funnel_intro_fr, funnel_closing_en, funnel_closing_de, funnel_closing_fr, scarcity_threshold",
    )
    .eq("id", eventId)
    .single();
  if (error) throw new Error(error.message);
  return data as EventFunnelCopy;
}

export async function updateEventFunnelCopy(
  eventId: string,
  formData: FormData,
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const record: EventFunnelCopy = {
    hero_video_url:
      ((formData.get("hero_video_url") as string) || "").trim() || null,
    funnel_tagline_en:
      ((formData.get("funnel_tagline_en") as string) || "").trim() || null,
    funnel_tagline_de:
      ((formData.get("funnel_tagline_de") as string) || "").trim() || null,
    funnel_tagline_fr:
      ((formData.get("funnel_tagline_fr") as string) || "").trim() || null,
    funnel_intro_en:
      ((formData.get("funnel_intro_en") as string) || "").trim() || null,
    funnel_intro_de:
      ((formData.get("funnel_intro_de") as string) || "").trim() || null,
    funnel_intro_fr:
      ((formData.get("funnel_intro_fr") as string) || "").trim() || null,
    funnel_closing_en:
      ((formData.get("funnel_closing_en") as string) || "").trim() || null,
    funnel_closing_de:
      ((formData.get("funnel_closing_de") as string) || "").trim() || null,
    funnel_closing_fr:
      ((formData.get("funnel_closing_fr") as string) || "").trim() || null,
    scarcity_threshold: Math.max(
      0,
      parseInt((formData.get("scarcity_threshold") as string) || "20", 10) || 0,
    ),
  };
  const { error } = await supabase
    .from("events")
    .update(record)
    .eq("id", eventId);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_event_funnel_copy",
    entity_type: "events",
    entity_id: eventId,
    details: {
      hasVideo: !!record.hero_video_url,
      scarcityThreshold: record.scarcity_threshold,
    },
  });
  const slug = await getEventSlug(eventId);
  await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  return { success: true };
}
