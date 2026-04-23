-- =============================================================================
-- 20260429000008  about_content
-- =============================================================================
-- Makes the About page admin-editable, SSOT-clean. Two small additions:
--
-- 1. public.company_info (singleton) gains three JSONB columns — one per
--    locale — holding the new DB-driven About sections (mission, story,
--    values, metrics, press logos, final CTA). Shape validated at write
--    time against the AboutSections type in @dbc/types. Empty {} = the
--    section renders nothing; admin can turn each section on/off by
--    adding/removing keys. The existing hero + founder + locations
--    content stays in i18n JSON for this ship.
--
-- 2. public.team_members gains a featured_on_about boolean. The About
--    page selects the 4-6 flagged members into a preview strip that
--    renders with the exact same card atom the /team list uses — so
--    the design drifts nowhere. Partial index keeps the query cheap.
-- =============================================================================

ALTER TABLE public.company_info
  ADD COLUMN IF NOT EXISTS about_sections_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about_sections_de jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about_sections_fr jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.company_info.about_sections_en IS
  'EN locale About-page sections (mission/story/values/metrics/press/finalCta). Shape validated against AboutSections in @dbc/types.';
COMMENT ON COLUMN public.company_info.about_sections_de IS
  'DE locale equivalent. Falls back to about_sections_en when keys are missing.';
COMMENT ON COLUMN public.company_info.about_sections_fr IS
  'FR locale equivalent. Falls back to about_sections_en when keys are missing.';

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS featured_on_about boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS team_members_featured_on_about_idx
  ON public.team_members(featured_on_about)
  WHERE featured_on_about;

COMMENT ON COLUMN public.team_members.featured_on_about IS
  'When true, this member appears in the /about page preview strip. Admins toggle this per-member on the team edit form.';
