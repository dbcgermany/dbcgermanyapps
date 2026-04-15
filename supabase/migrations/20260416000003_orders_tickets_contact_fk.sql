-- =============================================================================
-- Link orders + tickets to contacts. Also split attendee_name into
-- attendee_first_name / attendee_last_name.
-- Date: 2026-04-16
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attendee_first_name text,
  ADD COLUMN IF NOT EXISTS attendee_last_name text;

CREATE INDEX IF NOT EXISTS idx_orders_contact  ON public.orders  (contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON public.tickets (contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_attendee_name
  ON public.tickets (lower(attendee_first_name), lower(attendee_last_name));

-- Backfill first/last from existing single `attendee_name` column.
UPDATE public.tickets
   SET attendee_first_name = COALESCE(attendee_first_name, split_part(attendee_name, ' ', 1)),
       attendee_last_name  = COALESCE(
         attendee_last_name,
         NULLIF(regexp_replace(attendee_name, '^\S+\s*', ''), '')
       )
 WHERE attendee_name IS NOT NULL;

-- Keep attendee_name in sync with first + last on future writes.
CREATE OR REPLACE FUNCTION public.tickets_sync_attendee_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.attendee_first_name IS NOT NULL OR NEW.attendee_last_name IS NOT NULL THEN
    NEW.attendee_name := trim(
      COALESCE(NEW.attendee_first_name, '') || ' ' || COALESCE(NEW.attendee_last_name, '')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tickets_sync_attendee_name ON public.tickets;
CREATE TRIGGER trg_tickets_sync_attendee_name
  BEFORE INSERT OR UPDATE OF attendee_first_name, attendee_last_name ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.tickets_sync_attendee_name();
