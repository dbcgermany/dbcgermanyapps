-- =============================================================================
-- 20260526000002  affiliate program (modular, temporary)
-- =============================================================================
-- External-partner affiliate program for ticket sales. Designed for the
-- Richesses 2026 campaign and future per-event campaigns over a ~2-year
-- horizon, then likely replaced by a dedicated affiliate login app.
--
-- All tables prefixed `affiliate_*` (and `event_affiliates`) so removal is a
-- single PR: drop these tables, delete /packages/affiliate/, remove the
-- handful of hook lines in webhook + nav + thin route wrappers.
--
-- Bank info is NOT stored — payouts handled offline (Qonto, email). The
-- `affiliates.notes` free-text field holds external payment references.
--
-- Access is via long unguessable dashboard tokens (32-byte base64url), not
-- Supabase auth. One token per affiliate per event, auto-expires
-- event.ends_at + 20 days or when admin revokes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- affiliates: one row per external partner, independent of any event.
-- profile_id is nullable; only filled if the same person later becomes a
-- community member or admin (then we link via auth.users.id).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name      text NOT NULL,
  contact_email     text NOT NULL UNIQUE,
  preferred_locale  text NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en','de','fr')),
  country           text,
  status            text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','paused','terminated')),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliates_status_idx ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS affiliates_profile_id_idx ON public.affiliates(profile_id) WHERE profile_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- event_affiliates: per-event enrollment with commission %, the coupon that
-- represents this affiliate at this event, and the dashboard token.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_affiliates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  affiliate_id        uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  commission_pct      numeric(5,2) NOT NULL CHECK (commission_pct >= 0 AND commission_pct <= 100),
  coupon_id           uuid NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  dashboard_token     text NOT NULL UNIQUE,
  token_expires_at    timestamptz NOT NULL,
  token_revoked_at    timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, affiliate_id),
  UNIQUE (event_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS event_affiliates_event_id_idx ON public.event_affiliates(event_id);
CREATE INDEX IF NOT EXISTS event_affiliates_affiliate_id_idx ON public.event_affiliates(affiliate_id);
CREATE INDEX IF NOT EXISTS event_affiliates_coupon_id_idx ON public.event_affiliates(coupon_id);

-- Partial unique index on coupons to prevent multiple affiliate coupons per
-- event (combined with the FK in event_affiliates, ensures 1:1).
CREATE UNIQUE INDEX IF NOT EXISTS coupons_event_affiliate_unique_idx
  ON public.coupons(event_id)
  WHERE purpose = 'affiliate';

-- ---------------------------------------------------------------------------
-- affiliate_referrals: every redemption of an affiliate code, including
-- comped/zero-total orders. Unique on order_id (idempotent webhook insert).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  affiliate_id       uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  event_affiliate_id uuid NOT NULL REFERENCES public.event_affiliates(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_referrals_event_affiliate_id_idx ON public.affiliate_referrals(event_affiliate_id);

-- ---------------------------------------------------------------------------
-- affiliate_payouts: admin-created payout batch per affiliate. Must exist
-- before affiliate_commissions can reference it via payout_id FK.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id           uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  status                 text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  amount_cents           integer NOT NULL CHECK (amount_cents >= 0),
  currency               text NOT NULL DEFAULT 'EUR',
  period_starts_at       date,
  period_ends_at         date,
  paid_at                timestamptz,
  payment_reference      text,
  statement_storage_path text,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_id_idx ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx ON public.affiliate_payouts(status);

-- ---------------------------------------------------------------------------
-- affiliate_commissions: money-earning referrals only. Status lifecycle:
--   pending  → eligible (after cooldown) → payout_queued → paid
--                                       → reversed (refunds)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  affiliate_id       uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  event_affiliate_id uuid NOT NULL REFERENCES public.event_affiliates(id) ON DELETE CASCADE,
  commission_cents   integer NOT NULL CHECK (commission_cents >= 0),
  currency           text NOT NULL DEFAULT 'EUR',
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','eligible','payout_queued','paid','reversed')),
  cooldown_until     timestamptz NOT NULL,
  payout_id          uuid REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
  reversal_reason    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_id_idx ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_commissions_event_affiliate_id_idx ON public.affiliate_commissions(event_affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_commissions_status_idx ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS affiliate_commissions_payout_id_idx ON public.affiliate_commissions(payout_id) WHERE payout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS affiliate_commissions_cooldown_pending_idx
  ON public.affiliate_commissions(cooldown_until)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- updated_at triggers — reuse the project's standard `set_updated_at` helper
-- if it exists. If not, the application layer can update it manually.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    EXECUTE 'CREATE TRIGGER affiliates_set_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
    EXECUTE 'CREATE TRIGGER event_affiliates_set_updated_at BEFORE UPDATE ON public.event_affiliates FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
    EXECUTE 'CREATE TRIGGER affiliate_payouts_set_updated_at BEFORE UPDATE ON public.affiliate_payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
    EXECUTE 'CREATE TRIGGER affiliate_commissions_set_updated_at BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.affiliates IS
  'External marketing partners. Banking info is NOT stored — handled offline. Notes field references external payout docs.';
COMMENT ON TABLE public.event_affiliates IS
  'Per-event affiliate enrollment with commission % and dashboard access token. Coupon FK is the affiliate''s referral code at this event.';
COMMENT ON COLUMN public.event_affiliates.dashboard_token IS
  '32-byte base64url random with aff_ prefix. Used as the URL slug at /partner/{token}. Bearer-style auth.';
COMMENT ON TABLE public.affiliate_referrals IS
  'Every coupon redemption attributed to an affiliate, including comped/zero-total orders. Money-earning conversions also create an affiliate_commissions row.';
COMMENT ON TABLE public.affiliate_commissions IS
  'Money-earning referrals. Status: pending → eligible (after cooldown) → payout_queued → paid, or reversed on refund.';
COMMENT ON TABLE public.affiliate_payouts IS
  'Manual bank-transfer payout batches. payment_reference is the Qonto/bank transaction ID entered by admin.';
