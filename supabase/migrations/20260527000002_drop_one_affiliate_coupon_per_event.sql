-- =============================================================================
-- 20260527000002  drop "one affiliate coupon per event" partial unique index
-- =============================================================================
-- The original affiliate migration (20260526000002) added:
--   CREATE UNIQUE INDEX coupons_event_affiliate_unique_idx
--     ON coupons(event_id) WHERE purpose = 'affiliate';
--
-- That came from a design assumption that's no longer true (each affiliate
-- gets their own coupon at this event, not a shared one). With the new
-- model, every enrolled affiliate that opts in for a discount creates an
-- independent coupon row — they must be able to coexist on the same event.
--
-- The semantic uniqueness we actually need is already enforced elsewhere:
--   - event_affiliates UNIQUE (event_id, affiliate_id) — one enrollment
--     per affiliate per event
--   - event_affiliates UNIQUE (event_id, coupon_id)    — same coupon can't
--     back two enrollments at this event
-- =============================================================================

DROP INDEX IF EXISTS public.coupons_event_affiliate_unique_idx;
