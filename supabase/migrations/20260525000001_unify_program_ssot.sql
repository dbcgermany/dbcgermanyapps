-- =============================================================================
-- Unify event_schedule_items (public) + event_runsheet_items (internal) into
-- one SSOT table. Old `event_schedule_items` becomes a backward-compat VIEW
-- so existing SELECTs in the marketing/tickets site keep working unchanged.
--
-- Why: SSOT (one table, one form, one server action, one PDF generator), and
-- so the user can mark any row "public" or "internal" with a single click
-- without retyping it into two systems.
--
-- Reads:  event_schedule_items (VIEW) returns rows WHERE is_public = true
--         event_runsheet_items (TABLE) returns all rows (admin)
-- Writes: only event_runsheet_items (via actions/program.ts).
--
-- Date: 2026-05-25
-- =============================================================================

BEGIN;

-- 1. Extend event_runsheet_items to absorb everything event_schedule_items had
--    plus the canonical-people FKs the user asked for (no more free-text owner)
ALTER TABLE public.event_runsheet_items
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  -- Multilingual title/description (existing single-string `title`/`description`
  -- become the EN values; admin form will fan-out into _de / _fr on edit.)
  ADD COLUMN IF NOT EXISTS title_de text,
  ADD COLUMN IF NOT EXISTS title_fr text,
  ADD COLUMN IF NOT EXISTS description_de text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  -- Legacy inline speaker fields (preserved so the schedule VIEW can return
  -- the same column shape it did before; new rows prefer speaker_id instead).
  ADD COLUMN IF NOT EXISTS speaker_first_name text,
  ADD COLUMN IF NOT EXISTS speaker_last_name text,
  ADD COLUMN IF NOT EXISTS speaker_name text,
  ADD COLUMN IF NOT EXISTS speaker_title text,
  ADD COLUMN IF NOT EXISTS speaker_image_url text,
  -- Canonical-people FKs (any one may be set; mutually exclusive on the form)
  ADD COLUMN IF NOT EXISTS speaker_id uuid REFERENCES public.speakers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.event_runsheet_items.is_public IS
  'When true, the row is part of the public-facing program (marketing site agenda + attendee PDF). When false, internal-only (staff run-sheet PDF). Toggled inline in admin without form submit.';
COMMENT ON COLUMN public.event_runsheet_items.title_de IS
  'German title. Falls back to `title` (EN) when null.';
COMMENT ON COLUMN public.event_runsheet_items.title_fr IS
  'French title. Falls back to `title` (EN) when null.';
COMMENT ON COLUMN public.event_runsheet_items.speaker_id IS
  'Optional FK to canonical speakers row. When set, the public agenda renders the speaker card from the speakers table. Mutually exclusive with team_member_id / contact_id on the admin form.';
COMMENT ON COLUMN public.event_runsheet_items.team_member_id IS
  'Optional FK to canonical team_members row. Use for DBC staff owning a slot. Mutually exclusive with speaker_id / contact_id.';
COMMENT ON COLUMN public.event_runsheet_items.contact_id IS
  'Optional FK to canonical contacts row. Use for external vendors / service providers owning a slot. Mutually exclusive with speaker_id / team_member_id.';

CREATE INDEX IF NOT EXISTS idx_event_runsheet_items_event_public_sort
  ON public.event_runsheet_items (event_id, is_public, sort_order, starts_at);
CREATE INDEX IF NOT EXISTS idx_event_runsheet_items_speaker_id
  ON public.event_runsheet_items (speaker_id) WHERE speaker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_runsheet_items_team_member_id
  ON public.event_runsheet_items (team_member_id) WHERE team_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_runsheet_items_contact_id
  ON public.event_runsheet_items (contact_id) WHERE contact_id IS NOT NULL;

-- 2. Migrate any existing event_schedule_items rows into event_runsheet_items
--    (idempotent: skip rows that already exist at the same time with the same EN title).
INSERT INTO public.event_runsheet_items
  (event_id, starts_at, ends_at,
   title, title_de, title_fr,
   description, description_de, description_fr,
   speaker_id, speaker_first_name, speaker_last_name, speaker_name,
   speaker_title, speaker_image_url,
   sort_order, is_public, status)
SELECT
  s.event_id, s.starts_at, s.ends_at,
  s.title_en, s.title_de, s.title_fr,
  s.description_en, s.description_de, s.description_fr,
  s.speaker_id, s.speaker_first_name, s.speaker_last_name, s.speaker_name,
  s.speaker_title, s.speaker_image_url,
  s.sort_order, true, 'pending'
FROM public.event_schedule_items s
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_runsheet_items r
  WHERE r.event_id = s.event_id
    AND r.starts_at = s.starts_at
    AND r.title = s.title_en
);

-- 3. Rename the source table aside as a safety net (one-release rollback path).
ALTER TABLE public.event_schedule_items
  RENAME TO _event_schedule_items_legacy;

COMMENT ON TABLE public._event_schedule_items_legacy IS
  'DEPRECATED — kept for one release as rollback safety. All reads now hit the event_schedule_items VIEW which projects from event_runsheet_items WHERE is_public = true. Will be dropped in a follow-up migration.';

-- 4. Create event_schedule_items as a VIEW with the EXACT shape it had as a
--    table. Every existing SELECT in the tickets/marketing site keeps working
--    unchanged. Writes (INSERT/UPDATE/DELETE) against the view will fail — by
--    design: writes have been rerouted through actions/program.ts.
CREATE OR REPLACE VIEW public.event_schedule_items
WITH (security_invoker = on) AS
SELECT
  id,
  event_id,
  starts_at,
  ends_at,
  title           AS title_en,
  title_de,
  title_fr,
  description     AS description_en,
  description_de,
  description_fr,
  speaker_id,
  speaker_first_name,
  speaker_last_name,
  speaker_name,
  speaker_title,
  speaker_image_url,
  sort_order
FROM public.event_runsheet_items
WHERE is_public = true;

COMMENT ON VIEW public.event_schedule_items IS
  'Backward-compat view over event_runsheet_items WHERE is_public = true. Reads only. Writes go through actions/program.ts. Drops in a follow-up migration once all consumers are confirmed migrated.';

-- 5. Add cross-link FKs from checklist + budget to runsheet rows so day-of
--    activities can be traced to their prep checklist item and their budget
--    line. ON DELETE SET NULL — losing a runsheet row doesn't cascade-wipe
--    the prep checklist or the spend record.
ALTER TABLE public.event_checklist_items
  ADD COLUMN IF NOT EXISTS runsheet_item_id uuid
    REFERENCES public.event_runsheet_items(id) ON DELETE SET NULL;
ALTER TABLE public.event_expenses
  ADD COLUMN IF NOT EXISTS runsheet_item_id uuid
    REFERENCES public.event_runsheet_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_checklist_items_runsheet_item_id
  ON public.event_checklist_items (runsheet_item_id) WHERE runsheet_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_expenses_runsheet_item_id
  ON public.event_expenses (runsheet_item_id) WHERE runsheet_item_id IS NOT NULL;

COMMENT ON COLUMN public.event_checklist_items.runsheet_item_id IS
  'Optional FK to the runsheet item this prep activity serves (e.g., "Book Rolls Royce" → VIP arrival row).';
COMMENT ON COLUMN public.event_expenses.runsheet_item_id IS
  'Optional FK to the runsheet item this spend pays for (e.g., catering line → networking-break row).';

COMMIT;
