-- =============================================================================
-- Newsletter campaigns + per-recipient send tracking.
-- Date: 2026-04-16
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preheader text,
  body_mdx text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT 'DBC Germany',
  from_email text NOT NULL DEFAULT 'newsletter@dbc-germany.com',
  reply_to text DEFAULT 'info@dbc-germany.com',
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','de','fr','multi')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','sending','sent','failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  target_category_slugs text[] NOT NULL DEFAULT '{}',
  exclude_category_slugs text[] NOT NULL DEFAULT '{}',
  recipients_count int,
  opens_count int NOT NULL DEFAULT 0,
  clicks_count int NOT NULL DEFAULT 0,
  bounces_count int NOT NULL DEFAULT 0,
  unsubscribes_count int NOT NULL DEFAULT 0,
  resend_broadcast_id text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_newsletters_updated_at ON public.newsletters;
CREATE TRIGGER trg_newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON public.newsletters (status);

CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email text NOT NULL,
  resend_message_id text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sent','delivered','bounced','opened','clicked','unsubscribed','failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  unsubscribed_at timestamptz,
  error text
);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter
  ON public.newsletter_sends (newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status
  ON public.newsletter_sends (status);
