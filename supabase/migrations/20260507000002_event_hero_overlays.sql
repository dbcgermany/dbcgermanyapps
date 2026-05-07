-- =============================================================================
-- DBC Germany — Event hero overlay (centered PNG + small text + darkening)
--
-- The public event hero used to be conditional: hero_video_url XOR
-- cover_image_url, with no overlay support. Admins now want to lay a
-- centered PNG + a smaller localised line of copy on top, plus tune a
-- darkening tint so anything below stays readable. The darkening slider
-- is a single smallint 0–100 mapped to rgba(0,0,0,X/100) on the page.
--
-- Also extends the existing event-covers bucket so the same uploader can
-- accept video files (mp4/webm/quicktime) and PNG overlays — no new
-- bucket, no new policies (the manager+ admin-write policies on
-- event-covers already cover the new mime types).
-- Date: 2026-05-07
-- =============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hero_overlay_image_url text,
  ADD COLUMN IF NOT EXISTS hero_overlay_text_en text,
  ADD COLUMN IF NOT EXISTS hero_overlay_text_de text,
  ADD COLUMN IF NOT EXISTS hero_overlay_text_fr text,
  ADD COLUMN IF NOT EXISTS hero_darkening_strength smallint NOT NULL DEFAULT 50;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT events_hero_darkening_strength_range
    CHECK (hero_darkening_strength BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.events.hero_overlay_image_url IS
  'PNG (transparency-preserving) shown centered over the hero video/image.';
COMMENT ON COLUMN public.events.hero_darkening_strength IS
  'Darkening tint strength 0–100; mapped to rgba(0,0,0,X/100) on the public hero.';

UPDATE storage.buckets
   SET file_size_limit = 52428800,
       allowed_mime_types = ARRAY[
         'image/jpeg','image/png','image/webp','image/avif',
         'video/mp4','video/webm','video/quicktime'
       ]
 WHERE id = 'event-covers';
