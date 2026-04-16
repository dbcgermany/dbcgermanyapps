-- =============================================================================
-- DBC Germany — SEO fields on events, news_posts, and company_info
-- Date: 2026-04-20
-- =============================================================================

-- Events: per-event SEO overrides
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS og_image_url text;

-- News posts: per-article SEO overrides
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS og_image_url text;

-- Company info: search console verification + analytics
ALTER TABLE public.company_info
  ADD COLUMN IF NOT EXISTS google_site_verification text,
  ADD COLUMN IF NOT EXISTS bing_site_verification text;

COMMENT ON COLUMN public.events.seo_title IS
  'Override for <title> tag — max 60 chars recommended. Falls back to event title.';
COMMENT ON COLUMN public.events.seo_description IS
  'Override for <meta description> — max 160 chars. Falls back to event description excerpt.';
COMMENT ON COLUMN public.news_posts.seo_title IS
  'Override for <title> tag — max 60 chars recommended. Falls back to post title.';
COMMENT ON COLUMN public.news_posts.seo_description IS
  'Override for <meta description> — max 160 chars. Falls back to excerpt.';
