-- Per-ticket email idempotency.
--
-- Today the order-level `orders.email_sent_at` is the only stamp. If
-- send-tickets-for-order succeeds for 3 of 4 attendees and fails on the
-- 4th, the loop logs the failure but never stamps order.email_sent_at,
-- so the next retry re-sends to attendees 1-3 (duplicates).
--
-- Adding `tickets.email_sent_at` lets the loop skip already-sent rows on
-- retry. The order's stamp now means "every ticket sent at least once",
-- not "started sending" — the send-tickets code is updated to stamp it
-- only when all rows have email_sent_at.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tickets_email_unsent
  ON public.tickets (order_id) WHERE email_sent_at IS NULL;

COMMENT ON COLUMN public.tickets.email_sent_at IS
  'Set the moment Resend accepts the per-attendee ticket email. Used by
   send-tickets-for-order to skip rows on retry so partial-success loops
   never duplicate sends.';
