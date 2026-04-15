-- =============================================================================
-- Per-contact staff-authored messages. Used by the admin "compose to contact"
-- flow (one-off personal emails that are NOT marketing and do not require
-- double opt-in).
-- Date: 2026-04-17
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body_md text NOT NULL,
  reply_to text,
  resend_message_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_contact_sent
  ON public.contact_messages (contact_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_sent_by
  ON public.contact_messages (sent_by);

COMMENT ON TABLE public.contact_messages IS
  'One-off personal emails sent by staff to a single contact. Not marketing.';

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_read ON public.contact_messages;
CREATE POLICY contact_messages_read ON public.contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('team_member', 'manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS contact_messages_insert ON public.contact_messages;
CREATE POLICY contact_messages_insert ON public.contact_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('team_member', 'manager', 'admin', 'super_admin')
    )
  );
