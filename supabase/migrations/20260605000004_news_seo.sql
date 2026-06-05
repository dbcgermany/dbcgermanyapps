-- Phase 4 — per-article SEO (RankMath-style). Additive. The existing single
-- seo_title/seo_description/og_image_url stay as fallbacks.
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS seo_title_en text,
  ADD COLUMN IF NOT EXISTS seo_title_de text,
  ADD COLUMN IF NOT EXISTS seo_title_fr text,
  ADD COLUMN IF NOT EXISTS seo_description_en text,
  ADD COLUMN IF NOT EXISTS seo_description_de text,
  ADD COLUMN IF NOT EXISTS seo_description_fr text,
  ADD COLUMN IF NOT EXISTS focus_keyword_en text,
  ADD COLUMN IF NOT EXISTS focus_keyword_de text,
  ADD COLUMN IF NOT EXISTS focus_keyword_fr text,
  ADD COLUMN IF NOT EXISTS og_title_en text,
  ADD COLUMN IF NOT EXISTS og_title_de text,
  ADD COLUMN IF NOT EXISTS og_title_fr text,
  ADD COLUMN IF NOT EXISTS og_description_en text,
  ADD COLUMN IF NOT EXISTS og_description_de text,
  ADD COLUMN IF NOT EXISTS og_description_fr text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS robots_noindex boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS robots_nofollow boolean NOT NULL DEFAULT false,
  -- Article | NewsArticle | BlogPosting | Opinion | Interview
  ADD COLUMN IF NOT EXISTS schema_type text NOT NULL DEFAULT 'NewsArticle';

-- Slug-rename history → 301 redirects from old URLs.
CREATE TABLE IF NOT EXISTS public.news_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text UNIQUE NOT NULL,
  post_id uuid REFERENCES public.news_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_news_slug_history_post ON public.news_slug_history (post_id);
