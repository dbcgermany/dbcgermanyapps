-- Per-user state on a contact: private notes + pipeline status.
--
-- contacts.admin_notes is shared by all team members. This migration adds
-- a sibling per-user record so each operator can keep their own private
-- notes and a personal pipeline classification (new / engaged /
-- considering / declined) without leaking opinions to other team members.
-- RLS pins both reads and writes to user_id = auth.uid().
--
-- Also adds five contact-level business fields (tier, sector,
-- best_contact_method, pitch_tier, confidence) that describe the contact
-- itself across all events. Those stay on contacts because they're
-- observable facts, not per-user opinions.

-- 1. Pipeline status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_status') THEN
    CREATE TYPE public.pipeline_status AS ENUM (
      'new',
      'engaged',
      'considering',
      'declined'
    );
  END IF;
END$$;

-- 2. Per-user state table
CREATE TABLE IF NOT EXISTS public.contact_user_state (
  contact_id      uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  private_notes   text,
  pipeline_status public.pipeline_status,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, user_id)
);

CREATE INDEX IF NOT EXISTS contact_user_state_user_pipeline_idx
  ON public.contact_user_state (user_id, pipeline_status);

-- 3. RLS — only the owning user can read or write their own row.
ALTER TABLE public.contact_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own state read"  ON public.contact_user_state;
DROP POLICY IF EXISTS "own state write" ON public.contact_user_state;

CREATE POLICY "own state read"
  ON public.contact_user_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own state write"
  ON public.contact_user_state
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. updated_at touch trigger
CREATE OR REPLACE FUNCTION public.contact_user_state_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS contact_user_state_touch_updated_at ON public.contact_user_state;
CREATE TRIGGER contact_user_state_touch_updated_at
  BEFORE UPDATE ON public.contact_user_state
  FOR EACH ROW
  EXECUTE FUNCTION public.contact_user_state_touch_updated_at();

-- 5. Business fields on contacts (global, observable facts)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS tier                text,
  ADD COLUMN IF NOT EXISTS sector              text,
  ADD COLUMN IF NOT EXISTS best_contact_method text,
  ADD COLUMN IF NOT EXISTS pitch_tier          text,
  ADD COLUMN IF NOT EXISTS confidence          smallint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'contacts_confidence_range'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_confidence_range
      CHECK (confidence IS NULL OR (confidence BETWEEN 0 AND 100));
  END IF;
END$$;
