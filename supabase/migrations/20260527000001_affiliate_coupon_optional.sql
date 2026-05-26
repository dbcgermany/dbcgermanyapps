-- =============================================================================
-- 20260527000001  affiliate coupon optional + tracking_tag
-- =============================================================================
-- Original design (20260526000002) required every affiliate enrollment to have
-- a coupon code. That conflates two concerns:
--   1) Tracking the affiliate's referrals (whose sale was this?)
--   2) Discounting the buyer (does the visitor get a price break?)
--
-- Affiliates earn a commission for driving a sale regardless of whether the
-- buyer received a discount. Coupons should be OPTIONAL per enrollment. The
-- primary tracking mechanism is now a unique `tracking_tag` per enrollment
-- (the `aff_xxx` value in the referral URL's ?src= param). If admin also
-- wants to offer a discount, they attach a coupon — but it's not required.
-- =============================================================================

-- 1. Make coupon_id nullable.
ALTER TABLE public.event_affiliates
  ALTER COLUMN coupon_id DROP NOT NULL;

-- 2. Add tracking_tag (short, URL-safe, unique). Used in the ?src=aff_xxx
--    query param at checkout, then read from orders.source by the webhook.
ALTER TABLE public.event_affiliates
  ADD COLUMN IF NOT EXISTS tracking_tag text;

-- Backfill any existing rows with a derived tag (first 8 chars of the id).
UPDATE public.event_affiliates
   SET tracking_tag = substring(replace(id::text, '-', '') from 1 for 8)
 WHERE tracking_tag IS NULL;

ALTER TABLE public.event_affiliates
  ALTER COLUMN tracking_tag SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_affiliates_tracking_tag_unique_idx
  ON public.event_affiliates(tracking_tag);

COMMENT ON COLUMN public.event_affiliates.tracking_tag IS
  'Short URL-safe identifier embedded in the affiliate''s referral URL as ?src=aff_<tag>. Read from orders.source by the Stripe webhook to attribute conversions without requiring a coupon.';
COMMENT ON COLUMN public.event_affiliates.coupon_id IS
  'Optional. If set, the affiliate also offers their audience a discount via this coupon. Independent of the tracking_tag.';
