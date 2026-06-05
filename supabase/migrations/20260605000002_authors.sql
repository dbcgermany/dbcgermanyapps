-- Phase 2 — Authors (dedicated, linked to contacts/team_members) + post_authors
-- Additive. RLS NOT enabled (matches news_posts / contact_categories
-- convention; public anon reads rely on RLS-disabled + default grants).

CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  -- coach | expert | journalist | staff | guest | dbc_org
  type text NOT NULL DEFAULT 'guest',
  role_title_en text,
  role_title_de text,
  role_title_fr text,
  bio_en text,
  bio_de text,
  bio_fr text,
  photo_url text,
  email text,
  linkedin_url text,
  website_url text,
  instagram_url text,
  -- external authors are also added to the CRM; staff authors reuse a team
  -- member's photo/bio. Both nullable.
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  is_org_default boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reuse the shared updated_at trigger helper.
DROP TRIGGER IF EXISTS authors_set_updated_at ON public.authors;
CREATE TRIGGER authors_set_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

CREATE TABLE IF NOT EXISTS public.post_authors (
  post_id uuid REFERENCES public.news_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.authors(id) ON DELETE CASCADE,
  -- author | co_author | interviewer | interviewee | contributor
  role text NOT NULL DEFAULT 'author',
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, author_id)
);
CREATE INDEX IF NOT EXISTS idx_post_authors_author ON public.post_authors (author_id);

-- Seed the default organization author "DBC Germany".
INSERT INTO public.authors
  (slug, display_name, type, is_org_default, is_public, sort_order, bio_en, bio_de, bio_fr)
VALUES
  ('dbc-germany', 'DBC Germany', 'dbc_org', true, true, 0,
   'The German branch of Diambilay Business Center.',
   'Die deutsche Branche des Diambilay Business Center.',
   'La branche allemande du Diambilay Business Center.')
ON CONFLICT (slug) DO NOTHING;
