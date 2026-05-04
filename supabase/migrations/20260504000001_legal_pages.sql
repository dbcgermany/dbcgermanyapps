-- Legal pages: DB-driven, admin-editable replacement for the JSX-defined
-- legal documents in @dbc/legal. The render path on the public site (and
-- inside the tickets app) reads the published_body_markdown column; if it
-- is NULL, we fall back to the existing JSX components.
--
-- Workflow:
--   1. Admin edits body_markdown via /admin/[locale]/legal-pages
--   2. Admin clicks "Save draft" -> updates body_markdown only.
--   3. Admin clicks "Publish" -> copies body_markdown into
--      published_body_markdown, stamps published_at + published_by, then
--      revalidates the legal-pages tag across all 3 apps.
--   4. Admin clicks "Restore default" -> wipes the row so the JSX
--      component renders.
--
-- We seed empty rows for the 15 (document_type x locale) combos so the
-- admin UI always shows them and the EXISTS check on render is cheap.

CREATE TABLE IF NOT EXISTS public.legal_pages (
  document_type TEXT NOT NULL CHECK (document_type IN (
    'impressum', 'privacy', 'terms', 'cookies', 'us_privacy_notice'
  )),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'de', 'fr')),
  title TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  published_body_markdown TEXT,
  published_title TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID,
  draft_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  draft_updated_by UUID,
  PRIMARY KEY (document_type, locale)
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Service role (server actions in admin app, public render in site/tickets)
-- always passes. authenticated users only see + edit if they have an
-- admin/owner profile in user_profiles.
DROP POLICY IF EXISTS "service role full" ON public.legal_pages;
CREATE POLICY "service role full" ON public.legal_pages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin staff edit" ON public.legal_pages;
CREATE POLICY "admin staff edit" ON public.legal_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "anyone read published" ON public.legal_pages;
CREATE POLICY "anyone read published" ON public.legal_pages
  FOR SELECT TO anon, authenticated
  USING (published_body_markdown IS NOT NULL);

-- Seed 15 empty rows so the admin UI sees the full grid on first load.
INSERT INTO public.legal_pages (document_type, locale)
SELECT d, l
FROM unnest(ARRAY['impressum','privacy','terms','cookies','us_privacy_notice']) d
CROSS JOIN unnest(ARRAY['en','de','fr']) l
ON CONFLICT (document_type, locale) DO NOTHING;
