-- Private staff-only notes on every runsheet item. Visible to all
-- managers in the admin UI but NEVER rendered in the runsheet PDF
-- export and NEVER reaches ticket-buyer emails (the runsheet is an
-- internal document; tickets don't carry runsheet data).
--
-- Distinct from `description`, which IS exported to the PDF.

ALTER TABLE public.event_runsheet_items
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.event_runsheet_items.notes IS
  'Internal staff-only notes. Never exported to the runsheet PDF, never sent to attendees. Distinct from `description` which is public-facing.';
