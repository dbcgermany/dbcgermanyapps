-- =============================================================================
-- 20260428000002  contact_person_ssot_fields
-- =============================================================================
-- Adds the person-SSOT fields that the admin "Add Contact" form + the shared
-- @dbc/ui AddressFields / professional atoms already transmit but that were
-- never represented in the contacts table. Additive, nullable, no indexes
-- (low-selectivity demographics).
--
-- See also:
--   apps/admin/src/app/[locale]/(authenticated)/contacts/new/new-contact-form.tsx
--   apps/admin/src/actions/contacts.ts
--   packages/ui/src/address-fields.tsx (AddressFields FormData keys)
-- =============================================================================

ALTER TABLE public.contacts
  -- Address — flat columns keyed 1-to-1 with AddressFields' FormData output.
  ADD COLUMN IF NOT EXISTS address_line_1 text,
  ADD COLUMN IF NOT EXISTS address_line_2 text,
  ADD COLUMN IF NOT EXISTS postal_code    text,
  ADD COLUMN IF NOT EXISTS city           text,
  ADD COLUMN IF NOT EXISTS state_region   text,
  -- Business / professional context — asked elsewhere (founders, investors)
  -- and centrally useful for a contact record.
  ADD COLUMN IF NOT EXISTS organization   text,
  ADD COLUMN IF NOT EXISTS linkedin_url   text;
