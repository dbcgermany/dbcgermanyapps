import { createServerClient } from "@dbc/supabase/server";
import { cache } from "react";

// Site-wide DBC/Richesses authority quotes used on the marketing homepage
// and events archive page. Cached per request via React's cache(); ISR is
// already pinged from the admin write path so no extra unstable_cache
// layering is needed here.

export interface SiteTestimonialRow {
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

const COLUMNS =
  "id, author_name, author_role_en, author_role_de, author_role_fr, author_photo_url, quote_en, quote_de, quote_fr, video_url, rating, is_featured, sort_order, source_url, source_label";

export const getFeaturedSiteTestimonials = cache(
  async (limit = 6): Promise<SiteTestimonialRow[]> => {
    try {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from("site_testimonials")
        .select(COLUMNS)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(limit);
      return (data ?? []) as SiteTestimonialRow[];
    } catch {
      return [];
    }
  },
);
