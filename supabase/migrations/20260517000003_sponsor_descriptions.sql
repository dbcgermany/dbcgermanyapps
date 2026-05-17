-- =============================================================================
-- 20260517000003  sponsor_descriptions
-- =============================================================================
-- Adds attendee-facing fields to `event_sponsors` so the Sponsors PDF
-- (shipped with every ticket-delivery email) can render a trilingual
-- one-paragraph blurb per sponsor plus a sector tag for the card chip.
--
-- The pre-existing `deliverables` column stays as-is — it's used for
-- internal sales/ops notes ("3x lounge mention, logo on signage") and
-- should not be conflated with the public-facing copy that ends up in
-- attendees' inboxes.
-- =============================================================================

ALTER TABLE public.event_sponsors
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_de text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  ADD COLUMN IF NOT EXISTS sector text;

-- Comments for the admin form / Supabase Studio
COMMENT ON COLUMN public.event_sponsors.description_en IS 'Public-facing one-paragraph sponsor description (English). Surfaces in the attendee Sponsors PDF.';
COMMENT ON COLUMN public.event_sponsors.description_de IS 'Public-facing one-paragraph sponsor description (German). Falls back to English if empty.';
COMMENT ON COLUMN public.event_sponsors.description_fr IS 'Public-facing one-paragraph sponsor description (French). Falls back to English if empty.';
COMMENT ON COLUMN public.event_sponsors.sector IS 'Short sector tag rendered as a chip on the sponsor card (e.g. "Banking", "Tech", "Logistics"). Free text by design — sectors evolve faster than enum migrations.';

-- Partial index lets the cron / send-ticket path quickly count confirmed
-- sponsors per event when deciding whether to attach a Sponsors PDF at all.
CREATE INDEX IF NOT EXISTS event_sponsors_confirmed_idx
  ON public.event_sponsors (event_id, sort_order)
  WHERE status IN ('confirmed', 'active', 'completed');
