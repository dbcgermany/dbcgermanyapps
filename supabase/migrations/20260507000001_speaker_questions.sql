-- =============================================================================
-- DBC Germany — Speaker Questions
--
-- Buyer-submitted questions for event speakers, surfaced in the admin so
-- moderators can triage and feed them into speaker prep. The buyer reaches
-- the form via a token-bearer URL `/{locale}/tickets/{ticket_token}/ask` —
-- same security model as the ticket PDF download route.
--
-- Idempotency for the prompt email is a single timestamp on `orders` so the
-- cron and the Stripe webhook hybrid-send path can share state without a
-- separate log table (matches `orders.email_sent_at` / `reminder_sent_at`).
--
-- Date: 2026-05-07
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Idempotency stamp on orders for the "ask a speaker" prompt email
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ask_speaker_email_sent_at timestamptz;

COMMENT ON COLUMN public.orders.ask_speaker_email_sent_at IS
  'Timestamp of when the "ask a speaker" prompt email was sent for this order. NULL means not yet sent. Set by send-ask-speakers-prompt helper after a successful Resend call.';

CREATE INDEX IF NOT EXISTS idx_orders_ask_speaker_unsent
  ON public.orders (event_id, created_at)
  WHERE ask_speaker_email_sent_at IS NULL
    AND status IN ('paid', 'comped');

-- ---------------------------------------------------------------------------
-- 2. Question-status enum (admin triage lifecycle)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE speaker_question_status AS ENUM (
    'new',
    'shortlisted',
    'answered',
    'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. speaker_questions table
--
-- attendee_name / attendee_email / locale are snapshotted off the ticket at
-- submit time so deleting a ticket later doesn't leave the question with
-- a dangling NULL contact (the row itself cascades on ticket delete, but
-- snapshotting is cheap insurance for audit + admin triage UX).
--
-- The composite FK on (event_id, speaker_id) → event_speakers is what
-- enforces "the speaker must actually be assigned to this event" at the
-- DB layer — the server action also checks it, but this is the belt.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.speaker_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  ticket_id  uuid NOT NULL REFERENCES public.tickets(id)  ON DELETE CASCADE,
  order_id   uuid NOT NULL REFERENCES public.orders(id)   ON DELETE CASCADE,
  -- Snapshot of submitter identity at submit time
  attendee_name  text NOT NULL,
  attendee_email text NOT NULL,
  locale         text NOT NULL CHECK (locale IN ('en','de','fr')),
  question       text NOT NULL CHECK (char_length(question) BETWEEN 10 AND 2000),
  status         speaker_question_status NOT NULL DEFAULT 'new',
  admin_notes    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT speaker_questions_event_speaker_fk
    FOREIGN KEY (event_id, speaker_id)
    REFERENCES public.event_speakers (event_id, speaker_id)
    ON DELETE CASCADE
);

COMMENT ON TABLE public.speaker_questions IS
  'Buyer-submitted questions for event speakers. Inserted via tickets-app server action gated by ticket_token + abuse_events rate limit; read by admin via requireRole("manager").';

CREATE INDEX IF NOT EXISTS idx_speaker_questions_event_status
  ON public.speaker_questions (event_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speaker_questions_speaker
  ON public.speaker_questions (speaker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speaker_questions_ticket
  ON public.speaker_questions (ticket_id);

DROP TRIGGER IF EXISTS trg_speaker_questions_updated_at ON public.speaker_questions;
CREATE TRIGGER trg_speaker_questions_updated_at
  BEFORE UPDATE ON public.speaker_questions
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

-- Match the rest of the schema: RLS off; access gated by requireRole() in
-- server actions (per 20260427000008_revert_rls_partial.sql).
ALTER TABLE public.speaker_questions DISABLE ROW LEVEL SECURITY;
