-- Add sort_order column to event_sponsors. The admin query at
-- apps/admin/src/actions/sponsors.ts already SELECTs and ORDER BYs this column,
-- which made the whole Sponsors page crash. This migration unbreaks it.

ALTER TABLE event_sponsors
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill existing rows by created_at order so drag-reorder has a stable start
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY event_id ORDER BY created_at) * 10 AS new_sort
  FROM event_sponsors
)
UPDATE event_sponsors es SET sort_order = ordered.new_sort
FROM ordered WHERE ordered.id = es.id;

CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_sort
  ON event_sponsors (event_id, sort_order);
