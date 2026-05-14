-- =============================================================================
-- 20260514000002  contact_email_verified_hq_country
-- =============================================================================
-- Two SSOT fields needed across every contact (sponsor prospects surfaced the
-- need first):
--   email_verified — distinguishes confirmed personal addresses from pattern-
--                    guessed or generic team inboxes. Drives a glanceable
--                    badge in the contact detail header.
--   hq_country     — origin / HQ country, separate from contacts.country which
--                    is the contact's current location. Captures patterns like
--                    "Nigeria → France" (HQ in NG, contact based in FR).
--
-- Both additive + idempotent. No indexes (low selectivity).
-- =============================================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hq_country     text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'contacts_hq_country_iso2_chk'
       AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_hq_country_iso2_chk
      CHECK (
        hq_country IS NULL
        OR (hq_country = upper(hq_country) AND length(hq_country) = 2)
      );
  END IF;
END $$;

COMMENT ON COLUMN public.contacts.email_verified IS
  'true = personal email confirmed; false = pattern-guessed or generic team inbox.';
COMMENT ON COLUMN public.contacts.hq_country IS
  'HQ / origin country (ISO 3166-1 alpha-2). Separate from contacts.country, which is the contact''s current location.';
