-- Phase 6 — HTML newsletter bodies. Additive nullable column; existing
-- body_mdx (plain text) stays as the fallback for old drafts.
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS body_html text;
