-- Phase 3 — pillar/cluster relationship on news_posts (additive).
-- A pillar is a cornerstone article; clusters point to their pillar via
-- pillar_id. Powers the editor's internal-link suggestions.
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS is_pillar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pillar_id uuid
    REFERENCES public.news_posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_news_posts_pillar ON public.news_posts (pillar_id);
