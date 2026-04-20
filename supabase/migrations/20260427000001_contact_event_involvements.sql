-- Event-scoped contact involvements.
--
-- The contacts table answers "who do we know?" but not "who is doing what
-- for which event?". Sponsors, partners, speakers, contractors, volunteers
-- etc. can't be filtered per event via the category system because
-- categories are role-only (cross-event).
--
-- This migration adds a many-to-many join that captures (contact, event,
-- role). Backfills from orders (attendee / invited_guest) and event_sponsors
-- (sponsor). New admin flows (manual add, sponsor form, invitation, door
-- sale, purchase) also insert here going forward.

-- 1. Role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'involvement_role') THEN
    CREATE TYPE public.involvement_role AS ENUM (
      'attendee',
      'invited_guest',
      'sponsor',
      'partner',
      'contractor',
      'speaker',
      'moderator',
      'volunteer',
      'staff',
      'press',
      'vip'
    );
  END IF;
END$$;

-- 2. Join table
CREATE TABLE IF NOT EXISTS public.contact_event_involvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role public.involvement_role NOT NULL,
  notes text,
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contact_id, event_id, role)
);

CREATE INDEX IF NOT EXISTS contact_event_involvements_event_role_idx
  ON public.contact_event_involvements (event_id, role);
CREATE INDEX IF NOT EXISTS contact_event_involvements_contact_idx
  ON public.contact_event_involvements (contact_id);

-- 3. Backfill from orders: acquisition_type='invited' → invited_guest, else attendee.
INSERT INTO public.contact_event_involvements (contact_id, event_id, role)
SELECT DISTINCT o.contact_id, o.event_id,
       CASE WHEN o.acquisition_type = 'invited'
            THEN 'invited_guest'::public.involvement_role
            ELSE 'attendee'::public.involvement_role
       END
  FROM public.orders o
 WHERE o.contact_id IS NOT NULL
ON CONFLICT (contact_id, event_id, role) DO NOTHING;

-- 4. Backfill from event_sponsors.
INSERT INTO public.contact_event_involvements (contact_id, event_id, role)
SELECT DISTINCT s.contact_id, s.event_id, 'sponsor'::public.involvement_role
  FROM public.event_sponsors s
 WHERE s.contact_id IS NOT NULL
ON CONFLICT (contact_id, event_id, role) DO NOTHING;

-- 5. RLS — managers and above read/write. Matches the policy shape used for
--    site_settings in 20260418000021_settings_rls.sql.
ALTER TABLE public.contact_event_involvements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage involvements" ON public.contact_event_involvements;
CREATE POLICY "staff manage involvements"
  ON public.contact_event_involvements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('manager','admin','super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('manager','admin','super_admin')
    )
  );
