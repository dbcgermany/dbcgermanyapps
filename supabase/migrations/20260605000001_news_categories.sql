-- Phase 1 — News categories (many-to-many) --------------------------------
-- Mirrors contact_categories / contact_category_links. RLS is intentionally
-- NOT enabled, matching the repo convention established by
-- 20260427000008_revert_rls_partial.sql: @supabase/ssr runs queries as the
-- user JWT, so RLS-with-no-policy breaks server reads; public anon reads
-- rely on RLS-disabled + default public-schema grants, exactly like
-- news_posts. Server actions already gate writes via requireRole().

CREATE TABLE IF NOT EXISTS public.news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_de text,
  name_fr text,
  description_en text,
  description_de text,
  description_fr text,
  seo_title_en text,
  seo_title_de text,
  seo_title_fr text,
  seo_description_en text,
  seo_description_de text,
  seo_description_fr text,
  -- token-palette KEY (e.g. 'red','gold','blue','teal','purple','slate'),
  -- mapped to theme tokens at render — NEVER a raw hex (SSOT design rule).
  color text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news_category_links (
  post_id uuid REFERENCES public.news_posts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.news_categories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES public.profiles(id),
  PRIMARY KEY (post_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_news_category_links_category
  ON public.news_category_links (category_id);

-- At most one primary category per post (drives the card badge).
CREATE UNIQUE INDEX IF NOT EXISTS uq_news_category_links_primary
  ON public.news_category_links (post_id) WHERE is_primary;

-- Seed starter categories. color = token-palette key (no hex here).
INSERT INTO public.news_categories
  (slug, name_en, name_de, name_fr, description_en, sort_order, color) VALUES
  ('announcements','Announcements','Ankündigungen','Annonces',
   'Official DBC Germany news and milestones.', 10, 'red'),
  ('insights','Insights','Einblicke','Analyses',
   'Analysis and perspectives on diaspora business.', 20, 'gold'),
  ('events','Events','Veranstaltungen','Événements',
   'Event announcements, previews and recaps.', 30, 'blue'),
  ('interviews','Interviews','Interviews','Entretiens',
   'Conversations with founders, experts and guests.', 40, 'teal'),
  ('digital','Digital','Digital','Numérique',
   'The DBC Germany digital build and ecosystem.', 50, 'purple')
ON CONFLICT (slug) DO UPDATE
  SET name_en = EXCLUDED.name_en,
      name_de = EXCLUDED.name_de,
      name_fr = EXCLUDED.name_fr,
      description_en = EXCLUDED.description_en,
      color = EXCLUDED.color,
      sort_order = EXCLUDED.sort_order;
