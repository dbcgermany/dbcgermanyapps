-- =============================================================================
-- 20260529000001  affiliate ↔ contact link (contact is king)
-- =============================================================================
-- An affiliate is a PERSON who holds a referral link. People live in `contacts`
-- (the SSOT, deduped by lower(email)). Until now `affiliates.contact_email` was
-- plain text with no link, so an affiliate was not in the contact list and could
-- not be filtered as such.
--
-- This migration:
--   1. Adds affiliates.contact_id (nullable FK → contacts) + first_name/last_name.
--      display_name stays NOT NULL (now derived "First Last") so every existing
--      reader (emails, dashboard, PDF, lists) keeps working unchanged.
--   2. Registers an `affiliate` system contact category so affiliates are
--      filterable in the Contacts list exactly like partners / press / speakers.
--   3. Backfills existing affiliates into contacts: split the name, find-or-create
--      the contact by email (never duplicating), link contact_id, tag `affiliate`.
--
-- Nullable FK + ON DELETE SET NULL keeps the modular affiliate program a one-PR
-- drop: removing it leaves the contacts (people remain).
-- =============================================================================

-- 1. Columns ------------------------------------------------------------------
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

CREATE INDEX IF NOT EXISTS affiliates_contact_id_idx
  ON public.affiliates(contact_id) WHERE contact_id IS NOT NULL;

COMMENT ON COLUMN public.affiliates.contact_id IS
  'FK to the contacts SSOT row for this affiliate (resolved by email). Nullable; ON DELETE SET NULL so contacts outlive the affiliate program.';

-- 2. Affiliate contact category ----------------------------------------------
INSERT INTO public.contact_categories (
  slug, name_en, name_de, name_fr, description_en, is_system, sort_order, color
) VALUES (
  'affiliate',
  'Affiliates',
  'Affiliates',
  'Affiliés',
  'People enrolled in the affiliate program — they hold a referral link and earn commission on attributed ticket sales. Linked 1:1 to their affiliates row via affiliates.contact_id.',
  true,
  90,
  '#0ea5e9'
)
ON CONFLICT (slug) DO UPDATE SET
  name_en        = EXCLUDED.name_en,
  name_de        = EXCLUDED.name_de,
  name_fr        = EXCLUDED.name_fr,
  description_en = EXCLUDED.description_en,
  is_system      = EXCLUDED.is_system,
  color          = EXCLUDED.color;

-- 3. Backfill -----------------------------------------------------------------
-- 3a. Derive first/last from the existing single display_name.
UPDATE public.affiliates a
   SET first_name = NULLIF(split_part(trim(a.display_name), ' ', 1), ''),
       last_name  = CASE
         WHEN strpos(trim(a.display_name), ' ') > 0
         THEN NULLIF(trim(substr(trim(a.display_name), strpos(trim(a.display_name), ' ') + 1)), '')
         ELSE NULL
       END
 WHERE a.first_name IS NULL AND a.last_name IS NULL;

-- 3b. Create a contact for any affiliate whose email isn't already a contact.
INSERT INTO public.contacts (email, first_name, last_name, country, locale)
SELECT lower(trim(a.contact_email)),
       a.first_name,
       a.last_name,
       NULLIF(upper(trim(a.country)), ''),
       CASE WHEN a.preferred_locale IN ('en','de','fr') THEN a.preferred_locale ELSE NULL END
  FROM public.affiliates a
 WHERE NOT EXISTS (
   SELECT 1 FROM public.contacts c WHERE lower(c.email) = lower(trim(a.contact_email))
 )
ON CONFLICT (email) DO NOTHING;

-- 3c. Point every affiliate at its contact.
UPDATE public.affiliates a
   SET contact_id = c.id
  FROM public.contacts c
 WHERE lower(c.email) = lower(trim(a.contact_email))
   AND a.contact_id IS DISTINCT FROM c.id;

-- 3d. Fill blanks on the contact name (never overwrite existing contact data).
UPDATE public.contacts c
   SET first_name = COALESCE(c.first_name, a.first_name),
       last_name  = COALESCE(c.last_name,  a.last_name)
  FROM public.affiliates a
 WHERE c.id = a.contact_id;

-- 3e. Tag every linked contact as an affiliate (idempotent).
INSERT INTO public.contact_category_links (contact_id, category_id)
SELECT a.contact_id, cat.id
  FROM public.affiliates a
  CROSS JOIN (SELECT id FROM public.contact_categories WHERE slug = 'affiliate') cat
 WHERE a.contact_id IS NOT NULL
ON CONFLICT DO NOTHING;
