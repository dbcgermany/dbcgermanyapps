-- External-branch event support.
--
-- DBC Germany runs its own events end-to-end (admin → site listing → checkout
-- → QR ticketing). The other DBC branches (France, …) run their own events
-- on their own infra. We still want their events to appear in the unified
-- upcoming-events grid on the public site + tickets, but a click on those
-- should open the branch's own URL in a new tab rather than hit our
-- checkout flow.
--
-- Adds two columns: event_branch (text + check constraint, lighter to evolve
-- than a Postgres enum if we later split 'other' into dbc_france /
-- dbc_belgium / …) and external_url (the destination for "other" events).
-- A second check enforces the coherence rule: dbc_germany events have NO
-- external_url; "other" events MUST have one.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_branch text NOT NULL DEFAULT 'dbc_germany'
    CHECK (event_branch IN ('dbc_germany','other')),
  ADD COLUMN IF NOT EXISTS external_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'events_external_url_required'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_external_url_required
      CHECK (
        (event_branch = 'dbc_germany' AND external_url IS NULL) OR
        (event_branch = 'other'
          AND external_url IS NOT NULL
          AND length(external_url) > 0)
      );
  END IF;
END$$;
