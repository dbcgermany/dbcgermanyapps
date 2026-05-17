-- =============================================================================
-- 20260517000002  certificate_sent_at
-- =============================================================================
-- Adds a per-ticket idempotency timestamp so the certificate cron can stamp
-- delivery and skip already-certified tickets on the next run.
--
-- Pattern matches the existing `tickets.email_sent_at` column used by the
-- ticket-delivery cron. Keeping certificate state on the ticket row (not the
-- order row) because certificates are personal to the attendee, not the buyer.
-- =============================================================================

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS certificate_sent_at timestamptz;

-- Partial index lets the cron quickly find "checked in but not yet certified"
-- without scanning the full tickets table.
CREATE INDEX IF NOT EXISTS tickets_pending_certificate_idx
  ON public.tickets (event_id)
  WHERE checked_in_at IS NOT NULL AND certificate_sent_at IS NULL;
