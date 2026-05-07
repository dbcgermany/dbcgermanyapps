import { createServerClient } from "@dbc/supabase/server";
import { cache } from "react";

// Direct, unwrapped fetch of just the home-hero fields. Bypasses the
// legal/getCompanyInfo helper because it wraps the call in
// unstable_cache, which doesn't compose well with createServerClient
// (the latter calls cookies() — a dynamic API). React's cache() still
// memoizes within a single request render.

export interface HomeHero {
  home_hero_video_url: string | null;
  home_hero_image_url: string | null;
  home_hero_overlay_image_url: string | null;
  home_hero_overlay_text_en: string | null;
  home_hero_overlay_text_de: string | null;
  home_hero_overlay_text_fr: string | null;
  home_hero_darkening_strength: number;
}

const FALLBACK: HomeHero = {
  home_hero_video_url: null,
  home_hero_image_url: null,
  home_hero_overlay_image_url: null,
  home_hero_overlay_text_en: null,
  home_hero_overlay_text_de: null,
  home_hero_overlay_text_fr: null,
  home_hero_darkening_strength: 50,
};

export const getHomeHero = cache(async (): Promise<HomeHero> => {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("company_info")
      .select(
        "home_hero_video_url, home_hero_image_url, home_hero_overlay_image_url, home_hero_overlay_text_en, home_hero_overlay_text_de, home_hero_overlay_text_fr, home_hero_darkening_strength"
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return FALLBACK;
    return {
      home_hero_video_url: data.home_hero_video_url ?? null,
      home_hero_image_url: data.home_hero_image_url ?? null,
      home_hero_overlay_image_url: data.home_hero_overlay_image_url ?? null,
      home_hero_overlay_text_en: data.home_hero_overlay_text_en ?? null,
      home_hero_overlay_text_de: data.home_hero_overlay_text_de ?? null,
      home_hero_overlay_text_fr: data.home_hero_overlay_text_fr ?? null,
      home_hero_darkening_strength:
        typeof data.home_hero_darkening_strength === "number"
          ? data.home_hero_darkening_strength
          : 50,
    };
  } catch {
    return FALLBACK;
  }
});
