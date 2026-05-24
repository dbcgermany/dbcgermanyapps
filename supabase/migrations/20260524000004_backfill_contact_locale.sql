-- Backfill contacts.locale from country for rows that don't have an
-- explicit preference yet. Mirrors the country→locale map used by
-- apps/admin/src/lib/contact-locale.ts. Future invitations to these
-- contacts short-circuit on the stored preference and stop reusing
-- the operator's URL locale.
--
-- Rows with locale already set are untouched. Rows with no country
-- stay NULL (and fall through to the send-time default).

UPDATE public.contacts
SET locale = CASE
  WHEN upper(country) IN
    ('FR','BE','LU','MC','CI','SN','CM','CD','ML','BF','GA','GN','BJ','TG','MG','DJ','RW','BI')
    THEN 'fr'
  WHEN upper(country) IN ('DE','AT','CH','LI') THEN 'de'
  ELSE 'en'
END
WHERE locale IS NULL
  AND country IS NOT NULL
  AND country <> '';
