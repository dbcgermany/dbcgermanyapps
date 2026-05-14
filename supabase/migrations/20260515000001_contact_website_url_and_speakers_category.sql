-- =============================================================================
-- 20260515000001  contact_website_url_and_speakers_category
-- =============================================================================
-- Two unrelated additions surfaced by the media + speaker contact PDFs:
--   • website_url — publication/company/personal website, separate from the
--     existing linkedin_url. SSOT for every contact (sponsors, press, speakers).
--   • Adds the `speakers` system contact category alongside the existing
--     `partners` / `press` / `founders` / … so speaker prospects can be tagged
--     identically to how sponsors are tagged with `partners`.
-- =============================================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS website_url text;

COMMENT ON COLUMN public.contacts.website_url IS
  'Publication, company, or personal website. Distinct from linkedin_url which is the LinkedIn profile.';

INSERT INTO public.contact_categories (
  slug, name_en, name_de, name_fr, description_en, is_system, sort_order, color
) VALUES (
  'speakers',
  'Speakers & Moderators',
  'Speaker & Moderator:innen',
  'Intervenant·es & modérateur·rices',
  'Outreach prospects for speaking slots, keynote candidates, moderators. Distinct from the public speakers table — that one holds only confirmed roster entries; this category covers the CRM pipeline.',
  true,
  85,
  '#8b5cf6'
)
ON CONFLICT (slug) DO UPDATE SET
  name_en        = EXCLUDED.name_en,
  name_de        = EXCLUDED.name_de,
  name_fr        = EXCLUDED.name_fr,
  description_en = EXCLUDED.description_en,
  is_system      = EXCLUDED.is_system,
  color          = EXCLUDED.color;
