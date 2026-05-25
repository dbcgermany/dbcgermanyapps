-- =============================================================================
-- Make the event_schedule_items VIEW derive speaker_name / speaker_title /
-- speaker_image_url from the linked speakers row when speaker_id is set.
--
-- Without this, programs that use the canonical FK (speaker_id) instead of
-- the legacy inline fields show "no speaker" on the public agenda — which
-- defeats the whole point of having a speakers library.
--
-- Coalesce order: legacy inline fields first (back-compat), then speakers
-- row, then NULL. Locale-neutral title_en is used since the public schedule
-- query in the tickets app reads a single `speaker_title` string without a
-- locale dimension.
--
-- Date: 2026-05-25
-- =============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.event_schedule_items
WITH (security_invoker = on) AS
SELECT
  r.id,
  r.event_id,
  r.starts_at,
  r.ends_at,
  r.title           AS title_en,
  r.title_de,
  r.title_fr,
  r.description     AS description_en,
  r.description_de,
  r.description_fr,
  r.speaker_id,
  COALESCE(r.speaker_first_name, s.first_name) AS speaker_first_name,
  COALESCE(r.speaker_last_name,  s.last_name)  AS speaker_last_name,
  COALESCE(
    r.speaker_name,
    CASE
      WHEN s.id IS NOT NULL THEN TRIM(s.first_name || ' ' || s.last_name)
      ELSE NULL
    END
  ) AS speaker_name,
  COALESCE(r.speaker_title,     s.title_en)  AS speaker_title,
  COALESCE(r.speaker_image_url, s.photo_url) AS speaker_image_url,
  r.sort_order
FROM public.event_runsheet_items r
LEFT JOIN public.speakers s ON s.id = r.speaker_id
WHERE r.is_public = true;

COMMIT;
