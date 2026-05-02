-- Production hardening migration:
--
--  1. orders: amount_refunded_cents (partial refund tracking) + revocation_waived
--     (German Widerrufsrecht waiver capture).
--  2. orders: state-transition trigger blocking illegal moves
--     (e.g. cancelled -> paid, refunded -> paid).
--  3. contacts: email_status enum + bounced_at + complained_at, fed by the
--     new Resend bounce webhook.
--  4. abuse_events: DB-backed rate limit log replacing in-memory Maps that
--     reset on every Vercel cold start.
--  5. coupons: applied_amount_cents kept on `orders` so refund + reporting
--     don't depend on coupon state being mutable post-payment.

-- 1. orders extensions
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS amount_refunded_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revocation_waived     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revocation_waived_at  timestamptz,
  ADD COLUMN IF NOT EXISTS revocation_waived_ip  inet;

COMMENT ON COLUMN public.orders.amount_refunded_cents IS
  'Total refunded so far. status flips to refunded only when this >= total_cents.';
COMMENT ON COLUMN public.orders.revocation_waived IS
  'German Widerrufsrecht: buyer explicitly waived the 14-day revocation right at checkout. Required for digital event tickets.';

-- 2. order status transition trigger
CREATE OR REPLACE FUNCTION public.guard_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- INSERT can land in any starting state.
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- No-op update.
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Allowed transitions:
  --   pending   -> paid, comped, cancelled, refunded
  --   paid      -> refunded
  --   comped    -> refunded, cancelled
  --   cancelled -> (terminal — no further transitions)
  --   refunded  -> (terminal)
  IF OLD.status = 'pending'   AND NEW.status IN ('paid','comped','cancelled','refunded') THEN RETURN NEW; END IF;
  IF OLD.status = 'paid'      AND NEW.status IN ('refunded') THEN RETURN NEW; END IF;
  IF OLD.status = 'comped'    AND NEW.status IN ('refunded','cancelled') THEN RETURN NEW; END IF;

  RAISE EXCEPTION
    'Illegal order status transition % -> % (order %)',
    OLD.status, NEW.status, OLD.id
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_transition ON public.orders;
CREATE TRIGGER trg_orders_status_transition
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_status_transition();

-- 3. contacts.email_status (Resend bounce/complaint feed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
    CREATE TYPE email_status AS ENUM ('active','bounced','complained','unsubscribed');
  END IF;
END$$;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS email_status        email_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS bounced_at          timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_reason      text,
  ADD COLUMN IF NOT EXISTS complained_at       timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contacts_email_status
  ON public.contacts (email_status) WHERE email_status <> 'active';

COMMENT ON COLUMN public.contacts.email_status IS
  'Set to bounced/complained by Resend webhook. All sending paths must skip non-active.';

-- 4. abuse_events: DB-backed rate limit log
CREATE TABLE IF NOT EXISTS public.abuse_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope       text   NOT NULL,
  key         text   NOT NULL,
  ip          inet,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abuse_events_scope_key_time
  ON public.abuse_events (scope, key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_events_scope_ip_time
  ON public.abuse_events (scope, ip, occurred_at DESC) WHERE ip IS NOT NULL;

-- Cleanup helper: keep 14 days only.
CREATE OR REPLACE FUNCTION public.prune_abuse_events()
RETURNS integer
LANGUAGE sql
AS $$
  WITH d AS (
    DELETE FROM public.abuse_events WHERE occurred_at < now() - interval '14 days'
    RETURNING 1
  )
  SELECT COUNT(*)::int FROM d;
$$;

COMMENT ON TABLE public.abuse_events IS
  'Rate-limit + abuse log. Replaces in-memory Maps that reset on Vercel cold starts.';

-- 5. orders.applied_discount_cents — already exists as discount_cents but we
-- want to be explicit that it is immutable post-payment. No schema change,
-- just a comment for documentation.
COMMENT ON COLUMN public.orders.discount_cents IS
  'Discount applied at checkout time. Frozen for the order — coupon edits after payment do NOT change this.';
