-- Phase D: newsletters.status + newsletter_sends.status text → enums.
--
-- Pre-existing CHECK constraints on both tables covered only a subset of
-- the values the app actually writes (e.g. CHECK allowed "scheduled" but
-- not "queued"; the app uses both). Unioning CHECK + app-code values so
-- this migration fixes the latent drift instead of narrowing further.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsletter_status') THEN
    CREATE TYPE public.newsletter_status AS ENUM (
      'draft','scheduled','queued','sending','sent','failed'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsletter_send_status') THEN
    CREATE TYPE public.newsletter_send_status AS ENUM (
      'queued','sent','delivered','bounced','opened','clicked','unsubscribed','failed'
    );
  END IF;
END$$;

-- newsletters.status — drop the CHECK (replaced by the enum type), then ALTER TYPE.
ALTER TABLE public.newsletters
  DROP CONSTRAINT IF EXISTS newsletters_status_check;

ALTER TABLE public.newsletters
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.newsletters
  ALTER COLUMN status TYPE public.newsletter_status
    USING status::public.newsletter_status;

ALTER TABLE public.newsletters
  ALTER COLUMN status SET DEFAULT 'draft'::public.newsletter_status;

-- newsletter_sends.status — same pattern.
ALTER TABLE public.newsletter_sends
  DROP CONSTRAINT IF EXISTS newsletter_sends_status_check;

ALTER TABLE public.newsletter_sends
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.newsletter_sends
  ALTER COLUMN status TYPE public.newsletter_send_status
    USING status::public.newsletter_send_status;

ALTER TABLE public.newsletter_sends
  ALTER COLUMN status SET DEFAULT 'queued'::public.newsletter_send_status;
