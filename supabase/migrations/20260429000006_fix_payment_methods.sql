-- =============================================================================
-- 20260429000006  fix_payment_methods
-- =============================================================================
-- The old `events.enabled_payment_methods` DEFAULT shipped the wrong values:
--   {card, sepa, paypal}
-- Stripe's actual Checkout Session `payment_method_types` uses `sepa_debit`
-- (not `sepa`), and the live account didn't have `paypal` activated. Every
-- new event therefore started broken — Stripe rejects the session with
-- `invalid_request_error`, every customer sees "Payment provider is
-- unavailable", and the admin has no UI to fix the row.
--
-- This migration:
--   1. Changes the DEFAULT to `{}` — the empty array tells the tickets code
--      to omit `payment_method_types` entirely, so Stripe uses the account's
--      Dashboard-configured methods (card, Apple Pay, Klarna, Link, etc.).
--      New events now ship healthy.
--   2. Rewrites any existing 'sepa' → 'sepa_debit' so historical rows align
--      with Stripe's canonical naming. If an admin had manually curated an
--      event's payment methods, this corrects the spelling without dropping
--      the intent.
--
-- Validation against STRIPE_PAYMENT_METHOD_TYPE_VALUES happens in the admin
-- `updateEvent` action from here on, so future saves can't reintroduce
-- invalid values.
-- =============================================================================

ALTER TABLE public.events
  ALTER COLUMN enabled_payment_methods SET DEFAULT '{}'::text[];

UPDATE public.events
SET enabled_payment_methods = array_replace(enabled_payment_methods, 'sepa', 'sepa_debit')
WHERE 'sepa' = ANY(enabled_payment_methods);
