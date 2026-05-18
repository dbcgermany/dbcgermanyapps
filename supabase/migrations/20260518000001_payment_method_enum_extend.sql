-- =============================================================================
-- 20260518000001  payment_method enum extension
-- =============================================================================
-- Robert Lechner paid €49 via Stripe Link on 2026-05-18 — webhook handler
-- attempted `UPDATE orders SET payment_method = 'link'` and Postgres rejected
-- with `invalid input value for enum payment_method`. The order stayed at
-- `pending`, no ticket email went out. The processed_webhooks dedup row was
-- inserted before the failure so Stripe retries returned 200 (duplicate) and
-- the order would have stayed stuck forever.
--
-- Root fix: add every payment_method type currently enabled (or pending) on
-- the live Stripe account (see credentials.md "Capabilities on the live
-- account"). New values:
--   link, bancontact, eps, pix, amazon_pay, ideal, giropay, p24,
--   cartes_bancaires
--
-- Belt-and-braces: the webhook handler also now whitelists known values and
-- falls back to NULL on unknown ones, so a future Stripe-only method never
-- repeats this failure mode.
-- =============================================================================

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'link';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'bancontact';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'eps';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'pix';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'amazon_pay';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'ideal';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'giropay';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'p24';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cartes_bancaires';
