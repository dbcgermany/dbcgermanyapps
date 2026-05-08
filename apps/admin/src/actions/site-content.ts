"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { pingRevalidate } from "@/lib/revalidate";

// Site-wide content (testimonials today; future global content like
// company-info hero copy can extend this file). Same shape and audit-log
// pattern as event-funnel-content; manager role gates writes; site +
// tickets ISR pinged after each write so the public surfaces refresh.

const SITE_PATHS_TO_REVALIDATE = ["/[locale]", "/[locale]/events"];
const TICKETS_PATHS_TO_REVALIDATE = ["/[locale]/events", "/[locale]/events/[slug]"];

export interface SiteTestimonial {
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
}

const SITE_TESTIMONIAL_COLUMNS =
  "id, author_name, author_role_en, author_role_de, author_role_fr, author_photo_url, quote_en, quote_de, quote_fr, video_url, rating, is_featured, sort_order, source_url, source_label";

export async function getSiteTestimonials(): Promise<SiteTestimonial[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("site_testimonials")
    .select(SITE_TESTIMONIAL_COLUMNS)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SiteTestimonial[];
}

function readSiteTestimonialForm(formData: FormData) {
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
    source_url: ((formData.get("source_url") as string) || "").trim() || null,
    source_label:
      ((formData.get("source_label") as string) || "").trim() || null,
  };
}

async function pingPublicSurfaces() {
  await Promise.all([
    pingRevalidate("site", SITE_PATHS_TO_REVALIDATE),
    pingRevalidate("tickets", TICKETS_PATHS_TO_REVALIDATE),
  ]);
}

export async function createSiteTestimonial(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readSiteTestimonialForm(formData);
  if (!fields.author_name || !fields.quote_en) {
    return { error: "Author name and English quote are required." };
  }
  const { error } = await supabase.from("site_testimonials").insert(fields);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_site_testimonial",
    entity_type: "site_testimonials",
    entity_id: null,
    details: { author: fields.author_name },
  });
  revalidatePath(
    `/${(formData.get("locale") as string) || "en"}/testimonials`,
  );
  await pingPublicSurfaces();
  return { success: true };
}

export async function updateSiteTestimonial(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const fields = readSiteTestimonialForm(formData);
  if (!fields.author_name || !fields.quote_en) {
    return { error: "Author name and English quote are required." };
  }
  const { error } = await supabase
    .from("site_testimonials")
    .update(fields)
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_site_testimonial",
    entity_type: "site_testimonials",
    entity_id: id,
    details: { author: fields.author_name },
  });
  revalidatePath(
    `/${(formData.get("locale") as string) || "en"}/testimonials`,
  );
  await pingPublicSurfaces();
  return { success: true };
}

export async function deleteSiteTestimonial(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("site_testimonials")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_site_testimonial",
    entity_type: "site_testimonials",
    entity_id: id,
    details: {},
  });
  revalidatePath(`/${locale}/testimonials`);
  await pingPublicSurfaces();
  return { success: true };
}
