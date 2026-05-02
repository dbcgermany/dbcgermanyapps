-- Stripe sync columns + payment_method enum extension.
--
-- 1. ticket_tiers gets stripe_product_id / stripe_price_id so checkout can
--    reference durable Stripe entities instead of inline price_data. Stripe
--    Prices are immutable, so on price change we archive the old Price and
--    push its ID into stripe_price_archived_ids.
-- 2. coupons gets stripe_coupon_id / stripe_promotion_code_id so admin codes
--    mirror to real Stripe Promotion Codes (lets ?code=FRIEND50 URLs auto-
--    apply through Stripe Checkout).
-- 3. payment_method enum gains 'sepa_debit' (canonical Stripe value; the
--    pre-existing 'sepa' stays as a tombstone) and 'klarna'. Postgres enums
--    are append-only.

-- 1. Tier <-> Stripe Product/Price linkage
ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS stripe_product_id        text,
  ADD COLUMN IF NOT EXISTS stripe_price_id          text,
  ADD COLUMN IF NOT EXISTS stripe_price_archived_ids text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_stripe_product_id
  ON public.ticket_tiers (stripe_product_id) WHERE stripe_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_stripe_price_id
  ON public.ticket_tiers (stripe_price_id) WHERE stripe_price_id IS NOT NULL;

COMMENT ON COLUMN public.ticket_tiers.stripe_price_id IS
  'Active Stripe Price ID. Checkout uses this when set; falls back to inline price_data when NULL.';
COMMENT ON COLUMN public.ticket_tiers.stripe_price_archived_ids IS
  'Historical Stripe Price IDs archived when price_cents changed. Stripe Prices are immutable.';

-- 2. Coupon <-> Stripe Promotion Code linkage
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS stripe_coupon_id          text,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id  text;

CREATE INDEX IF NOT EXISTS idx_coupons_stripe_promotion_code_id
  ON public.coupons (stripe_promotion_code_id) WHERE stripe_promotion_code_id IS NOT NULL;

COMMENT ON COLUMN public.coupons.stripe_promotion_code_id IS
  'Stripe Promotion Code ID. Tickets app passes discounts:[{promotion_code}] for URL ?code= auto-apply.';

-- 3. payment_method enum extension (append-only)
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'sepa_debit';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'klarna';
