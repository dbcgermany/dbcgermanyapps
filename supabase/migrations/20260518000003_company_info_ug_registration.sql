-- =============================================================================
-- 20260518000003  company_info: UG registration complete
-- =============================================================================
-- DBC Germany has officially registered as a UG (haftungsbeschränkt).
-- Update the canonical legal_name, legal_form and switch banking from the
-- previous N26 account to the new Qonto account opened for the UG.
--
-- The HRB / Handelsregister entry is still pending issuance; that field
-- stays NULL and will be filled in via a follow-up migration once the
-- Amtsgericht Düsseldorf issues the number. Until then, Impressum will
-- show the registration as "pending" automatically.
-- =============================================================================

-- legal_name + legal_form are concatenated by consumers (site footer, invoice
-- PDF, Impressum). Keep legal_name as the trading name only and put the legal
-- form in the dedicated column to avoid duplication ("DBC Germany UG (…) UG
-- (…)").
UPDATE company_info
SET
  legal_name = 'DBC Germany',
  legal_form = 'UG (haftungsbeschränkt)',
  iban       = 'DE15100101234756502653',
  bic        = 'QNTODEB2XXX',
  bank_name  = 'Qonto'
WHERE id = 1;
