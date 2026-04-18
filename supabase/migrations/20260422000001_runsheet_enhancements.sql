-- Run sheet enhancements: staff assignment, duration, updated_at, templates, seed

-- 1. Extend event_runsheet_items
ALTER TABLE event_runsheet_items
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE event_runsheet_items SET updated_at = created_at WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_runsheet_items_event_sort
  ON event_runsheet_items (event_id, sort_order, starts_at);

-- 2. Run sheet templates
CREATE TABLE IF NOT EXISTS event_runsheet_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  responsible_role text,
  default_offset_minutes integer NOT NULL,
  default_duration_minutes integer DEFAULT 15,
  location_note text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- 3. Seed default template rows
INSERT INTO event_runsheet_templates (title, responsible_role, default_offset_minutes, default_duration_minutes, sort_order) VALUES
  ('Venue setup begins', 'Production lead', -240, 60, 10),
  ('AV / sound check', 'AV crew', -120, 30, 20),
  ('Catering delivery', 'Catering lead', -90, 30, 30),
  ('Signage & registration setup', 'Production lead', -60, 30, 40),
  ('Staff briefing', 'Event manager', -30, 15, 50),
  ('Doors open / registration', 'Registration lead', 0, 30, 60),
  ('Opening remarks', 'Host', 30, 10, 70),
  ('Program begins', 'Event manager', 40, 120, 80),
  ('Networking break', 'Catering lead', 180, 30, 90),
  ('Closing remarks', 'Host', 300, 15, 100),
  ('Venue breakdown', 'Production lead', 360, 60, 110)
ON CONFLICT DO NOTHING;
