-- =============================================================================
-- DBC Germany — Database Schema
-- Version: 2026.04.10.1
-- Database: Supabase PostgreSQL (Frankfurt, EU)
-- =============================================================================
-- ALL PRICES IN CENTS (integer). €49.00 = 4900. No floats for money.
-- ALL TIMESTAMPS as timestamptz (UTC). Display in event timezone.
-- ALL PRIMARY KEYS as uuid via gen_random_uuid().
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CUSTOM TYPES (Enums)
-- ---------------------------------------------------------------------------

CREATE TYPE event_type AS ENUM ('conference', 'masterclass');

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'comped', 'refunded', 'cancelled');

CREATE TYPE acquisition_type AS ENUM ('purchased', 'invited', 'assigned', 'door_sale');

CREATE TYPE payment_method AS ENUM ('card', 'sepa', 'paypal', 'cash');

CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

CREATE TYPE user_role AS ENUM ('buyer', 'team_member', 'manager', 'admin', 'super_admin');

CREATE TYPE event_media_type AS ENUM ('photo', 'video', 'link');

-- ---------------------------------------------------------------------------
-- 2. PROFILES (extends auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'buyer',
  display_name text,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'de', 'fr')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth. Role checked on every Server Action via requireRole().';

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, locale)
  VALUES (
    NEW.id,
    'buyer',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'en')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. EVENTS
-- ---------------------------------------------------------------------------

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_de text NOT NULL,
  title_fr text NOT NULL,
  description_en text,
  description_de text,
  description_fr text,
  event_type event_type NOT NULL,
  venue_name text,
  venue_address text,
  city text,
  country text NOT NULL DEFAULT 'DE',
  timezone text NOT NULL DEFAULT 'Europe/Berlin',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer NOT NULL,
  max_tickets_per_order integer NOT NULL DEFAULT 10,
  enabled_payment_methods text[] NOT NULL DEFAULT '{card,sepa,paypal}',
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.events IS 'Events managed by admin. Published events appear on ticket.dbc-germany.com.';

CREATE INDEX idx_events_is_published ON public.events (is_published) WHERE is_published = true;
CREATE INDEX idx_events_starts_at ON public.events (starts_at);

-- ---------------------------------------------------------------------------
-- 4. EVENT SCHEDULE ITEMS
-- ---------------------------------------------------------------------------

CREATE TABLE public.event_schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title_en text NOT NULL,
  title_de text NOT NULL,
  title_fr text NOT NULL,
  description_en text,
  description_de text,
  description_fr text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  speaker_name text,
  speaker_title text,
  speaker_image_url text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_event_schedule_items_event_id ON public.event_schedule_items (event_id);

-- ---------------------------------------------------------------------------
-- 5. TICKET TIERS
-- ---------------------------------------------------------------------------

CREATE TABLE public.ticket_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_de text NOT NULL,
  name_fr text NOT NULL,
  description_en text,
  description_de text,
  description_fr text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  max_quantity integer, -- NULL = unlimited within event capacity
  quantity_sold integer NOT NULL DEFAULT 0,
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  is_public boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ticket_tiers IS 'Fully customizable per event. Hidden tiers (is_public=false) for invites/team.';

CREATE INDEX idx_ticket_tiers_event_id ON public.ticket_tiers (event_id);

-- ---------------------------------------------------------------------------
-- 6. COUPONS
-- ---------------------------------------------------------------------------

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE, -- NULL = global
  code text UNIQUE NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value integer NOT NULL, -- percentage (e.g., 20 for 20%) or cents (e.g., 1000 for €10)
  max_uses integer, -- NULL = unlimited
  times_used integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  applicable_tier_ids uuid[], -- NULL = all public tiers
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_event_id_code ON public.coupons (event_id, code);

-- ---------------------------------------------------------------------------
-- 7. ORDERS
-- ---------------------------------------------------------------------------

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id), -- NULL for comped/invited orders
  event_id uuid NOT NULL REFERENCES public.events(id),
  subtotal_cents integer NOT NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status order_status NOT NULL DEFAULT 'pending',
  acquisition_type acquisition_type NOT NULL DEFAULT 'purchased',
  payment_method payment_method,
  coupon_id uuid REFERENCES public.coupons(id),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  recipient_email text NOT NULL,
  recipient_name text NOT NULL,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'de', 'fr')),
  email_sent_at timestamptz, -- Idempotency: check before sending confirmation email
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_event_id_status ON public.orders (event_id, status);
CREATE INDEX idx_orders_buyer_id ON public.orders (buyer_id);
CREATE INDEX idx_orders_stripe_checkout_session ON public.orders (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. TICKETS (1 per attendee)
-- ---------------------------------------------------------------------------

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id),
  tier_id uuid NOT NULL REFERENCES public.ticket_tiers(id),
  buyer_id uuid REFERENCES auth.users(id),
  ticket_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  attendee_name text NOT NULL,
  attendee_email text NOT NULL,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES public.profiles(id),
  is_transferred boolean NOT NULL DEFAULT false,
  notes text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tickets IS 'One row per attendee. ticket_token is the QR code payload. Rotated on transfer.';

CREATE INDEX idx_tickets_ticket_token ON public.tickets (ticket_token);
CREATE INDEX idx_tickets_event_id_checked_in ON public.tickets (event_id, checked_in_at);
CREATE INDEX idx_tickets_order_id ON public.tickets (order_id);
CREATE INDEX idx_tickets_attendee_email ON public.tickets (attendee_email);

-- ---------------------------------------------------------------------------
-- 9. STAFF EVENT ASSIGNMENTS
-- ---------------------------------------------------------------------------

CREATE TABLE public.staff_event_assignments (
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, event_id)
);

-- ---------------------------------------------------------------------------
-- 10. WAITLIST
-- ---------------------------------------------------------------------------

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE CASCADE,
  email text NOT NULL,
  notified_at timestamptz,
  expires_at timestamptz,
  purchased boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, tier_id, email)
);

CREATE INDEX idx_waitlist_entries_event_tier ON public.waitlist_entries (event_id, tier_id, created_at);

-- ---------------------------------------------------------------------------
-- 11. POST-EVENT EMAIL SEQUENCES
-- ---------------------------------------------------------------------------

CREATE TABLE public.event_email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  delay_days integer NOT NULL, -- Days after event ends
  subject_en text NOT NULL,
  subject_de text NOT NULL,
  subject_fr text NOT NULL,
  body_en text NOT NULL,
  body_de text NOT NULL,
  body_fr text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  sent_at timestamptz -- NULL = not sent yet. Set when the batch fires.
);

CREATE INDEX idx_event_email_sequences_event_id ON public.event_email_sequences (event_id);

-- ---------------------------------------------------------------------------
-- 12. EVENT MEDIA
-- ---------------------------------------------------------------------------

CREATE TABLE public.event_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type event_media_type NOT NULL,
  url text NOT NULL,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_media_event_id ON public.event_media (event_id);

-- ---------------------------------------------------------------------------
-- 13. NOTIFICATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id_read ON public.notifications (user_id, read_at);

-- ---------------------------------------------------------------------------
-- 14. AUDIT LOG
-- ---------------------------------------------------------------------------

CREATE TABLE public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_log IS 'Every admin/staff action logged. Retained 2 years (GDPR). Only Super Admin can view.';

CREATE INDEX idx_audit_log_user_id ON public.audit_log (user_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at);

-- ---------------------------------------------------------------------------
-- 15. ANALYTICS EVENTS
-- ---------------------------------------------------------------------------

CREATE TABLE public.analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  session_id text,
  user_id uuid REFERENCES auth.users(id),
  page_url text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_name_created ON public.analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_events_session ON public.analytics_events (session_id);

-- ---------------------------------------------------------------------------
-- 16. KPI SNAPSHOTS (materialized daily via pg_cron)
-- ---------------------------------------------------------------------------

CREATE TABLE public.kpi_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  tickets_sold integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  check_ins integer NOT NULL DEFAULT 0,
  unique_visitors integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, snapshot_date)
);

-- ---------------------------------------------------------------------------
-- 17. PROCESSED WEBHOOKS (idempotency for Stripe)
-- ---------------------------------------------------------------------------

CREATE TABLE public.processed_webhooks (
  id text PRIMARY KEY, -- Stripe event ID (evt_xxx)
  source text NOT NULL DEFAULT 'stripe',
  processed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.processed_webhooks IS 'Prevents duplicate webhook processing. Check before handling any Stripe event.';

-- ---------------------------------------------------------------------------
-- 18. HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

-- Atomic ticket inventory deduction (prevents overselling)
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_tier_id uuid,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.ticket_tiers
  SET quantity_sold = quantity_sold + p_quantity
  WHERE id = p_tier_id
    AND quantity_sold + p_quantity <= COALESCE(max_quantity, 999999)
  RETURNING 1 INTO v_updated;

  RETURN v_updated IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.reserve_tickets IS 'Atomic inventory deduction. Returns false if tier is sold out.';

-- Atomic coupon redemption (prevents overuse)
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_coupon_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.coupons
  SET times_used = times_used + 1
  WHERE id = p_coupon_id
    AND (max_uses IS NULL OR times_used < max_uses)
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  RETURNING 1 INTO v_updated;

  RETURN v_updated IS NOT NULL;
END;
$$;

-- Atomic check-in (prevents double scan)
CREATE OR REPLACE FUNCTION public.check_in_ticket(
  p_ticket_token uuid,
  p_event_id uuid,
  p_staff_id uuid
)
RETURNS TABLE (
  success boolean,
  ticket_id uuid,
  attendee_name text,
  attendee_email text,
  tier_name text,
  already_checked_in_at timestamptz,
  already_checked_in_by text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  -- Attempt atomic check-in
  UPDATE public.tickets t
  SET checked_in_at = now(),
      checked_in_by = p_staff_id
  WHERE t.ticket_token = p_ticket_token
    AND t.event_id = p_event_id
    AND t.checked_in_at IS NULL
  RETURNING t.id, t.attendee_name, t.attendee_email, t.tier_id
  INTO v_ticket;

  IF v_ticket.id IS NOT NULL THEN
    -- Success: return ticket info with tier name
    RETURN QUERY
    SELECT
      true AS success,
      v_ticket.id AS ticket_id,
      v_ticket.attendee_name,
      v_ticket.attendee_email,
      tt.name_en AS tier_name,
      NULL::timestamptz AS already_checked_in_at,
      NULL::text AS already_checked_in_by
    FROM public.ticket_tiers tt
    WHERE tt.id = v_ticket.tier_id;
  ELSE
    -- Failed: either invalid token, wrong event, or already checked in
    RETURN QUERY
    SELECT
      false AS success,
      t.id AS ticket_id,
      t.attendee_name,
      t.attendee_email,
      tt.name_en AS tier_name,
      t.checked_in_at AS already_checked_in_at,
      p.display_name AS already_checked_in_by
    FROM public.tickets t
    JOIN public.ticket_tiers tt ON tt.id = t.tier_id
    LEFT JOIN public.profiles p ON p.id = t.checked_in_by
    WHERE t.ticket_token = p_ticket_token;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.check_in_ticket IS 'Atomic QR check-in. Returns success + attendee info, or failure + who already scanned.';

-- Auto-update updated_at timestamp (optimistic locking support)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 19. REALTIME (for notifications + live check-in counters)
-- ---------------------------------------------------------------------------

-- Enable Realtime on notifications table for in-app notification bell
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable Realtime on tickets for live check-in counter on admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
