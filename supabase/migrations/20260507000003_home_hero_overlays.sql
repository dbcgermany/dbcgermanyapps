-- =============================================================================
-- DBC Germany — Homepage hero (marketing site)
--
-- Mirrors the per-event hero we shipped in 20260507000002 but on the
-- single-row company_info table so the marketing homepage on
-- dbc-germany.com can be admin-controlled the same way (background
-- image / video, centered PNG overlay, trilingual overlay text,
-- darkening tint slider).
--
-- Also extends the existing brand-assets bucket to accept video uploads
-- so the same single source of truth holds homepage media. The project-
-- level fileSizeLimit was already raised to 200 MB during the events
-- work, so no separate config call needed here.
-- Date: 2026-05-07
-- =============================================================================

ALTER TABLE public.company_info
  ADD COLUMN IF NOT EXISTS home_hero_video_url text,
  ADD COLUMN IF NOT EXISTS home_hero_image_url text,
  ADD COLUMN IF NOT EXISTS home_hero_overlay_image_url text,
  ADD COLUMN IF NOT EXISTS home_hero_overlay_text_en text,
  ADD COLUMN IF NOT EXISTS home_hero_overlay_text_de text,
  ADD COLUMN IF NOT EXISTS home_hero_overlay_text_fr text,
  ADD COLUMN IF NOT EXISTS home_hero_darkening_strength smallint NOT NULL DEFAULT 50;

DO $$ BEGIN
  ALTER TABLE public.company_info
    ADD CONSTRAINT company_info_home_hero_darkening_range
    CHECK (home_hero_darkening_strength BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.company_info.home_hero_video_url IS
  'Background video for the marketing homepage hero. Either a YouTube/Vimeo URL or a Supabase-hosted mp4 from brand-assets/home/hero-video/.';
COMMENT ON COLUMN public.company_info.home_hero_image_url IS
  'Fallback background image for the marketing homepage hero when no video is set.';
COMMENT ON COLUMN public.company_info.home_hero_overlay_image_url IS
  'PNG (transparency-preserved) shown centered over the homepage hero.';
COMMENT ON COLUMN public.company_info.home_hero_darkening_strength IS
  'Darkening tint strength 0–100; mapped to rgba(0,0,0,X/100) on the public hero.';

-- Extend brand-assets bucket so video uploads land in the same site-wide
-- bucket. Existing manager+ admin-write policies already cover the new
-- mime types — no policy change needed.
UPDATE storage.buckets
   SET file_size_limit = 104857600,
       allowed_mime_types = ARRAY[
         'image/jpeg','image/png','image/webp','image/avif','image/svg+xml',
         'video/mp4','video/webm','video/quicktime'
       ]
 WHERE id = 'brand-assets';
