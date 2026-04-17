-- Per-event poster content overrides (door-sale poster page).
-- Stores: eyebrow_en/de/fr, headline_en/de/fr, instructions_en/de/fr.
-- Falls back to hardcoded defaults when keys are missing.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS poster_config jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.events.poster_config IS
  'Per-event overrides for the door-sale poster text. Keys: eyebrow_en/de/fr, headline_en/de/fr, instructions_en/de/fr. Falls back to defaults if empty.';
