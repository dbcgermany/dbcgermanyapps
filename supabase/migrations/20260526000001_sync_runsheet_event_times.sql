-- =============================================================================
-- Sync events.starts_at / events.ends_at from public runsheet items.
--
-- The public ticket page (apps/tickets/.../events/[slug]/page.tsx) reads
-- event.starts_at / event.ends_at directly for the "When" card, the
-- Countdown, and the JSON-LD eventSchema. Until now the admin runsheet's
-- is_public toggle only fed the agenda list (via the event_schedule_items
-- VIEW from 20260525000001) — the headline date/time stayed manually
-- managed on the events row.
--
-- This migration makes public runsheet rows the source of truth for the
-- headline time too: an AFTER trigger on event_runsheet_items recomputes
-- events.starts_at = MIN(starts_at) and events.ends_at = MAX(ends_at) over
-- every row WHERE is_public = true for that event.
--
-- If an event has zero public rows, events.starts_at / events.ends_at are
-- left untouched — the public page falls back to whatever was last set,
-- avoiding a blank "When" card during early event setup.
--
-- Catches every write path: createRunsheetItem / updateRunsheetItem /
-- deleteRunsheetItem / toggleRunsheetItemPublic / reorderRunsheetItems in
-- apps/admin/src/actions/runsheet.ts, plus the bulk insert in
-- apps/admin/src/actions/events.ts. No application-code change required.
--
-- Date: 2026-05-26
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_event_times_from_public_runsheet()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Recompute bounds for the new event_id on INSERT / UPDATE.
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.event_id IS NOT NULL THEN
    UPDATE public.events e
    SET starts_at = sub.min_start,
        ends_at   = sub.max_end,
        updated_at = now()
    FROM (
      SELECT MIN(starts_at) AS min_start,
             MAX(ends_at)   AS max_end
      FROM public.event_runsheet_items
      WHERE event_id = NEW.event_id
        AND is_public = true
    ) sub
    WHERE e.id = NEW.event_id
      AND sub.min_start IS NOT NULL
      AND sub.max_end IS NOT NULL;
  END IF;

  -- Also recompute for the OLD event_id on DELETE, and on UPDATE when the
  -- row moved between events (rare but possible via the admin form).
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND OLD.event_id IS DISTINCT FROM NEW.event_id) THEN
    IF OLD.event_id IS NOT NULL THEN
      UPDATE public.events e
      SET starts_at = sub.min_start,
          ends_at   = sub.max_end,
          updated_at = now()
      FROM (
        SELECT MIN(starts_at) AS min_start,
               MAX(ends_at)   AS max_end
        FROM public.event_runsheet_items
        WHERE event_id = OLD.event_id
          AND is_public = true
      ) sub
      WHERE e.id = OLD.event_id
        AND sub.min_start IS NOT NULL
        AND sub.max_end IS NOT NULL;
    END IF;
  END IF;

  RETURN NULL;
END$$;

COMMENT ON FUNCTION public.sync_event_times_from_public_runsheet IS
  'Recomputes events.starts_at / events.ends_at as MIN/MAX of public runsheet rows for the affected event(s). Public runsheet items are the SSOT for the headline event time read by the public ticket page; this function denorms the bounds onto events so the page can keep reading events.starts_at directly. If an event has zero public runsheet rows, events.starts_at/ends_at are not modified (fallback to the last value).';

DROP TRIGGER IF EXISTS sync_event_times_from_public_runsheet
  ON public.event_runsheet_items;

CREATE TRIGGER sync_event_times_from_public_runsheet
  AFTER INSERT OR UPDATE OR DELETE
  ON public.event_runsheet_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_times_from_public_runsheet();

-- One-time backfill: bring every event with public runsheet items into
-- the new invariant. Events with no public rows are skipped.
UPDATE public.events e
SET starts_at = sub.min_start,
    ends_at   = sub.max_end,
    updated_at = now()
FROM (
  SELECT event_id,
         MIN(starts_at) AS min_start,
         MAX(ends_at)   AS max_end
  FROM public.event_runsheet_items
  WHERE is_public = true
  GROUP BY event_id
) sub
WHERE e.id = sub.event_id;

COMMIT;
