-- =============================================================================
-- DBC Germany — Event funnel content (pillars, testimonials, FAQs, intro/closing)
--
-- Adds per-event editable content for the conversion-driven funnel layout
-- (modelled after high-converting German info-product funnels — without
-- copying voice or design, only the architecture):
--
--   • event_pillars       — "What you'll take home" benefit cards (3–6)
--   • event_testimonials  — quotes + author photo + optional video thumbnail
--   • event_faqs          — objection-handling Q&A
--   • events.funnel_intro_*   — emotional bridge headline + body (trilingual)
--   • events.funnel_closing_* — final pitch headline + body (trilingual)
--
-- Every section is data-gated on the public page — events that have no
-- pillars / testimonials / FAQs render exactly as today. Admins populate
-- per event from a new "Funnel content" tab, so the same template works
-- for every edition (Richesses Germany 2026 → 2027 → other countries).
-- Date: 2026-05-06
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. event_pillars — "What you'll take home" benefit cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  -- icon name (lucide-react identifier, e.g. "handshake", "users", "graduation-cap")
  icon text,
  -- trilingual headline + short description
  title_en text NOT NULL,
  title_de text,
  title_fr text,
  description_en text,
  description_de text,
  description_fr text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_pillars IS
  '"What you''ll take home" cards for the public event funnel. 3–6 per event recommended. Renders as a grid below the featured speakers strip.';

CREATE INDEX IF NOT EXISTS idx_event_pillars_event_sort
  ON public.event_pillars (event_id, sort_order);

DROP TRIGGER IF EXISTS trg_event_pillars_updated_at ON public.event_pillars;
CREATE TRIGGER trg_event_pillars_updated_at
  BEFORE UPDATE ON public.event_pillars
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

ALTER TABLE public.event_pillars DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. event_testimonials — quote cards with author photo + optional video
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_role_en text,
  author_role_de text,
  author_role_fr text,
  author_photo_url text,
  -- trilingual quote body
  quote_en text NOT NULL,
  quote_de text,
  quote_fr text,
  -- optional video testimonial (YouTube/Vimeo URL); shows play overlay on photo
  video_url text,
  -- 1–5 star rating; null = no rating shown
  rating smallint CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  -- featured testimonials show first; others render in carousel
  is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_testimonials IS
  'Quote testimonials for the public event funnel. Optional video_url turns the author photo into a play-overlay video card.';

CREATE INDEX IF NOT EXISTS idx_event_testimonials_event_sort
  ON public.event_testimonials (event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_event_testimonials_featured
  ON public.event_testimonials (event_id, is_featured)
  WHERE is_featured = true;

DROP TRIGGER IF EXISTS trg_event_testimonials_updated_at ON public.event_testimonials;
CREATE TRIGGER trg_event_testimonials_updated_at
  BEFORE UPDATE ON public.event_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

ALTER TABLE public.event_testimonials DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. event_faqs — objection-handling Q&A
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question_en text NOT NULL,
  question_de text,
  question_fr text,
  answer_en text NOT NULL,
  answer_de text,
  answer_fr text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_faqs IS
  'Per-event FAQ entries shown as accordion on the public funnel page. Reduces objections before the final CTA.';

CREATE INDEX IF NOT EXISTS idx_event_faqs_event_sort
  ON public.event_faqs (event_id, sort_order);

DROP TRIGGER IF EXISTS trg_event_faqs_updated_at ON public.event_faqs;
CREATE TRIGGER trg_event_faqs_updated_at
  BEFORE UPDATE ON public.event_faqs
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

ALTER TABLE public.event_faqs DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. events: trilingual funnel intro + closing copy
-- funnel_intro_*    — short emotional-bridge body (3–5 sentences) shown
--                     between the featured speakers strip and the pillars
-- funnel_closing_*  — final pitch body shown above the FAQ / before footer
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS funnel_intro_en text,
  ADD COLUMN IF NOT EXISTS funnel_intro_de text,
  ADD COLUMN IF NOT EXISTS funnel_intro_fr text,
  ADD COLUMN IF NOT EXISTS funnel_closing_en text,
  ADD COLUMN IF NOT EXISTS funnel_closing_de text,
  ADD COLUMN IF NOT EXISTS funnel_closing_fr text;
