-- =============================================================================
-- 20260527000003  affiliate tier goals (free-ticket rewards)
-- =============================================================================
-- Adds a third independent reward mechanic alongside commission % and buyer
-- discount coupons: when an affiliate sells N tickets of a specific tier,
-- they earn M free tickets of a (possibly different) tier as a personal
-- reward.
--
-- Example rules an admin can configure per enrollment:
--   10 Starter sold → 1 Starter free for the affiliate
--    8 Premium sold → 1 Premium free
--    5 VIP sold     → 1 VIP free
--
-- Progress is computed live from affiliate_referrals → orders → tickets
-- (filtered to current valid tickets — refunded/revoked don't count).
-- Fulfillment is manual: admin sends the affiliate a coupon code outside
-- the system and marks the goal fulfilled.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.event_affiliate_tier_goals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_affiliate_id  uuid NOT NULL REFERENCES public.event_affiliates(id) ON DELETE CASCADE,
  tier_id             uuid NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE CASCADE,
  target_count        integer NOT NULL CHECK (target_count > 0),
  reward_tier_id      uuid NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE CASCADE,
  reward_count        integer NOT NULL DEFAULT 1 CHECK (reward_count > 0),
  fulfilled_at        timestamptz,
  fulfilled_notes     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- One goal per (enrollment, sold-tier). Admin can change target/reward by
  -- editing; cannot accidentally insert two rules for the same tier.
  UNIQUE (event_affiliate_id, tier_id)
);

CREATE INDEX IF NOT EXISTS event_affiliate_tier_goals_ea_idx
  ON public.event_affiliate_tier_goals(event_affiliate_id);
CREATE INDEX IF NOT EXISTS event_affiliate_tier_goals_unfulfilled_idx
  ON public.event_affiliate_tier_goals(event_affiliate_id)
  WHERE fulfilled_at IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    EXECUTE 'CREATE TRIGGER event_affiliate_tier_goals_set_updated_at BEFORE UPDATE ON public.event_affiliate_tier_goals FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.event_affiliate_tier_goals IS
  'Per-tier sales targets that earn the affiliate free tickets. Independent of commission % and discount coupons. Progress is computed live from affiliate_referrals; fulfillment is manual (admin sends a coupon code offline and marks fulfilled).';
