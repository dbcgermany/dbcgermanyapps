-- =============================================================================
-- DBC Germany — Site-wide testimonials + source attribution columns
--
-- Adds a global testimonials pool used on the marketing homepage and the
-- events archive page, plus a fallback on the public event page when an
-- event has no event-specific testimonials yet (so the Essen 2026 funnel
-- has authority quotes from day one).
--
-- Mirrors event_testimonials column-for-column minus event_id, plus two
-- attribution columns (source_url, source_label). Same columns are added
-- to event_testimonials so per-event quotes can also display attribution.
-- Date: 2026-05-08
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. site_testimonials — site-wide pool
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role_en text,
  author_role_de text,
  author_role_fr text,
  author_photo_url text,
  quote_en text NOT NULL,
  quote_de text,
  quote_fr text,
  video_url text,
  rating smallint CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  source_url text,
  source_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_testimonials IS
  'Site-wide DBC/Richesses authority quotes shown on the marketing homepage, events archive, and as a fallback on public event pages with no event-specific testimonials.';

CREATE INDEX IF NOT EXISTS idx_site_testimonials_sort
  ON public.site_testimonials (is_featured DESC, sort_order ASC);

DROP TRIGGER IF EXISTS trg_site_testimonials_updated_at ON public.site_testimonials;
CREATE TRIGGER trg_site_testimonials_updated_at
  BEFORE UPDATE ON public.site_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

ALTER TABLE public.site_testimonials DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. event_testimonials — add source attribution columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_testimonials
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_label text;
