-- =============================================================================
-- Add a human-friendly, event-scoped slug to ticket_tiers so bulk-invitation
-- CSVs can reference a tier by slug (e.g. "vip", "press") instead of UUID.
-- Backfills existing rows by slugifying name_en.
-- Date: 2026-04-17
-- =============================================================================

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: lowercase, spaces -> hyphens, strip non-alphanum-hyphen, trim hyphens
UPDATE public.ticket_tiers
   SET slug = regexp_replace(
                regexp_replace(lower(name_en), '[^a-z0-9]+', '-', 'g'),
                '^-+|-+$',
                '',
                'g'
              )
 WHERE slug IS NULL;

-- Ensure uniqueness within an event (two tiers with same slugified name get suffixed)
WITH dupes AS (
  SELECT id,
         slug,
         row_number() OVER (PARTITION BY event_id, slug ORDER BY created_at) AS rn
    FROM public.ticket_tiers
)
UPDATE public.ticket_tiers t
   SET slug = t.slug || '-' || (dupes.rn - 1)::text
  FROM dupes
 WHERE dupes.id = t.id
   AND dupes.rn > 1;

ALTER TABLE public.ticket_tiers
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_tiers_event_slug
  ON public.ticket_tiers (event_id, slug);

COMMENT ON COLUMN public.ticket_tiers.slug IS
  'URL/CSV-friendly identifier, unique per event. Used by bulk invite imports.';
