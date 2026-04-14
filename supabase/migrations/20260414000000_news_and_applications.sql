-- =============================================================================
-- DBC Germany — News posts + Incubation applications
-- Date: 2026-04-14
-- =============================================================================

-- ---------------------------------------------------------------------------
-- news_posts: public blog / announcement content, trilingual
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_de text NOT NULL,
  title_fr text NOT NULL,
  excerpt_en text,
  excerpt_de text,
  excerpt_fr text,
  body_en text NOT NULL,
  body_de text NOT NULL,
  body_fr text NOT NULL,
  cover_image_url text,
  author_name text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_posts_is_published
  ON public.news_posts (is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_posts_slug
  ON public.news_posts (slug);

COMMENT ON TABLE public.news_posts IS
  'Public news / blog posts managed via admin dashboard. Rendered on dbc-germany.com/[locale]/news.';

-- Keep updated_at fresh on row update
CREATE OR REPLACE FUNCTION public.news_posts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_news_posts_updated_at ON public.news_posts;
CREATE TRIGGER trg_news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

-- ---------------------------------------------------------------------------
-- incubation_applications: inbound leads from public /services/incubation form
-- ---------------------------------------------------------------------------

CREATE TYPE incubation_application_status AS ENUM (
  'new',
  'reviewing',
  'shortlisted',
  'rejected',
  'accepted'
);

CREATE TABLE IF NOT EXISTS public.incubation_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_name text NOT NULL,
  founder_email text NOT NULL,
  founder_phone text,
  company_name text,
  company_stage text,
  company_website text,
  country text,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'de', 'fr')),
  pitch text NOT NULL,
  funding_needed_cents integer,
  status incubation_application_status NOT NULL DEFAULT 'new',
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incubation_applications_status_created
  ON public.incubation_applications (status, created_at DESC);

COMMENT ON TABLE public.incubation_applications IS
  'Public-facing incubation application form submissions. Managed in admin dashboard.';

DROP TRIGGER IF EXISTS trg_incubation_applications_updated_at
  ON public.incubation_applications;
CREATE TRIGGER trg_incubation_applications_updated_at
  BEFORE UPDATE ON public.incubation_applications
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();
