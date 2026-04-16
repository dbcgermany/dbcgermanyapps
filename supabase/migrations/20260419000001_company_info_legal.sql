-- =============================================================================
-- DBC Germany — Company Info legal extension
-- Adds every field required by legal pages (Impressum, Privacy, Terms, Cookies)
-- so that NO company-identifying fact is hardcoded anywhere in the apps.
-- Date: 2026-04-19
-- =============================================================================

ALTER TABLE public.company_info
  -- Identity (extends existing legal_name / legal_form / managing_directors /
  -- responsible_person)
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS chamber_of_commerce text,
  ADD COLUMN IF NOT EXISTS professional_liability_insurance text,
  ADD COLUMN IF NOT EXISTS supervisory_authority text,

  -- Parent company (Diambilay Business Center SARL, Lubumbashi DRC)
  ADD COLUMN IF NOT EXISTS parent_company_name text,
  ADD COLUMN IF NOT EXISTS parent_company_address text,
  ADD COLUMN IF NOT EXISTS parent_company_city text,
  ADD COLUMN IF NOT EXISTS parent_company_country text,

  -- Office (operational HQ) — structured version of existing office_address blob
  ADD COLUMN IF NOT EXISTS office_line1 text,
  ADD COLUMN IF NOT EXISTS office_line2 text,
  ADD COLUMN IF NOT EXISTS office_postal_code text,
  ADD COLUMN IF NOT EXISTS office_city text,
  ADD COLUMN IF NOT EXISTS office_country text,

  -- French entity — structured version of existing fr_registered_address blob
  ADD COLUMN IF NOT EXISTS fr_legal_form text,
  ADD COLUMN IF NOT EXISTS fr_line1 text,
  ADD COLUMN IF NOT EXISTS fr_line2 text,
  ADD COLUMN IF NOT EXISTS fr_postal_code text,
  ADD COLUMN IF NOT EXISTS fr_city text,
  ADD COLUMN IF NOT EXISTS fr_country text,
  ADD COLUMN IF NOT EXISTS fr_director text,

  -- Contact channels (extends existing primary/support/press)
  ADD COLUMN IF NOT EXISTS privacy_email text,
  ADD COLUMN IF NOT EXISTS legal_email text,
  ADD COLUMN IF NOT EXISTS careers_email text,
  ADD COLUMN IF NOT EXISTS contact_form_url text,

  -- Data protection
  ADD COLUMN IF NOT EXISTS dpo_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dpo_name text,
  ADD COLUMN IF NOT EXISTS dpo_email text,
  ADD COLUMN IF NOT EXISTS eu_representative_name text,
  ADD COLUMN IF NOT EXISTS eu_representative_address text,
  ADD COLUMN IF NOT EXISTS uk_representative_name text,
  ADD COLUMN IF NOT EXISTS uk_representative_address text,
  ADD COLUMN IF NOT EXISTS popia_info_officer_name text,
  ADD COLUMN IF NOT EXISTS popia_info_officer_email text,
  ADD COLUMN IF NOT EXISTS ndpr_dpco_name text,
  ADD COLUMN IF NOT EXISTS ndpr_dpco_email text,
  ADD COLUMN IF NOT EXISTS eu_odr_link text DEFAULT 'https://ec.europa.eu/consumers/odr',
  ADD COLUMN IF NOT EXISTS vsbg_statement text DEFAULT 'not_willing'
    CHECK (vsbg_statement IN ('not_willing','willing_specified','willing_general'));

COMMENT ON COLUMN public.company_info.trade_name IS
  'Optional public-facing trading name if different from legal_name';
COMMENT ON COLUMN public.company_info.responsible_person IS
  'Person responsible for content per § 18 Abs. 2 MStV (German media state treaty, press-law responsible)';
COMMENT ON COLUMN public.company_info.dpo_required IS
  'True if GDPR Art. 37 designation threshold met; when false, privacy page renders "not required"';
COMMENT ON COLUMN public.company_info.vsbg_statement IS
  'Impressum § 36 VSBG statement: not_willing (default) / willing_specified / willing_general';
COMMENT ON COLUMN public.company_info.parent_company_name IS
  'Parent organization (e.g., Diambilay Business Center SARL, Lubumbashi DRC)';

-- Backfill structured office fields from the existing office_address blob
-- where the operator has already populated it. Non-destructive — the original
-- office_address column is preserved as a fallback/historical field.
UPDATE public.company_info
SET
  office_line1 = COALESCE(office_line1, 'Speditionstraße 15a'),
  office_postal_code = COALESCE(office_postal_code, '40221'),
  office_city = COALESCE(office_city, 'Düsseldorf'),
  office_country = COALESCE(office_country, 'DE')
WHERE id = 1
  AND (office_line1 IS NULL OR office_line1 = '');

-- Backfill structured French-entity fields from fr_registered_address
UPDATE public.company_info
SET
  fr_legal_form = COALESCE(fr_legal_form, 'SAS'),
  fr_line1 = COALESCE(fr_line1, '43 Avenue du Gros Chêne'),
  fr_postal_code = COALESCE(fr_postal_code, '95220'),
  fr_city = COALESCE(fr_city, 'Herblay-sur-Seine'),
  fr_country = COALESCE(fr_country, 'FR')
WHERE id = 1
  AND (fr_line1 IS NULL OR fr_line1 = '');

-- Backfill parent-org defaults so Impressum has a correct value on first render;
-- the admin can override in Company Info → Legal.
UPDATE public.company_info
SET
  parent_company_name = COALESCE(parent_company_name, 'Diambilay Business Center SARL'),
  parent_company_city = COALESCE(parent_company_city, 'Lubumbashi'),
  parent_company_country = COALESCE(parent_company_country, 'CD')
WHERE id = 1
  AND (parent_company_name IS NULL OR parent_company_name = '');
