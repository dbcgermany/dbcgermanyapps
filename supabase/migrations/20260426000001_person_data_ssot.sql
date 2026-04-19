-- =========================================================================
-- Person-data SSOT
-- -------------------------------------------------------------------------
-- 1. A typed enum for gender (Mr/Ms/Mrs titles imply female; that mapping
--    is enforced on the client, not here — gender stays nullable so the DB
--    doesn't lie about unknown values).
-- 2. Split single "name" / "*_name" columns on 7 person-ish tables into
--    first_name + last_name. A row-level trigger keeps the original
--    column in sync with first+last on every INSERT/UPDATE, so reads
--    never break and the DB physically prevents duplication.
-- 3. Add gender + title + birthday to the tables that should carry them
--    for demographics / CRM / onsite (tickets, orders, incubation, job
--    applications, team, profiles).
-- Safe to re-run (`IF NOT EXISTS` / `DO $$` guards).
-- =========================================================================

-- ------- 1. Gender enum ---------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_identity') THEN
    CREATE TYPE public.gender_identity AS ENUM (
      'female', 'male', 'non_binary', 'prefer_not_to_say'
    );
  END IF;
END $$;

-- Convert contacts.gender from text to enum, normalising existing values.
-- The old CHECK constraint (ARRAY['female','male','diverse','prefer_not_to_say'])
-- is superseded by the enum itself — drop it before the type conversion
-- so the ALTER doesn't collide with a constraint that talks in text.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts'
      AND column_name = 'gender' AND data_type = 'text'
  ) THEN
    -- Drop the free-text CHECK (if present) so the ALTER TABLE below
    -- isn't evaluating text = text after the column becomes an enum.
    ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_gender_check;

    -- Normalise any existing free-text values to enum values.
    UPDATE public.contacts
       SET gender = CASE lower(trim(gender))
                       WHEN 'f' THEN 'female'
                       WHEN 'female' THEN 'female'
                       WHEN 'frau' THEN 'female'
                       WHEN 'femme' THEN 'female'
                       WHEN 'w' THEN 'female'
                       WHEN 'm' THEN 'male'
                       WHEN 'male' THEN 'male'
                       WHEN 'herr' THEN 'male'
                       WHEN 'homme' THEN 'male'
                       WHEN 'nb' THEN 'non_binary'
                       WHEN 'non-binary' THEN 'non_binary'
                       WHEN 'non_binary' THEN 'non_binary'
                       WHEN 'diverse' THEN 'non_binary'
                       WHEN 'divers' THEN 'non_binary'
                       WHEN 'prefer_not_to_say' THEN 'prefer_not_to_say'
                       ELSE NULL
                    END
     WHERE gender IS NOT NULL;
    ALTER TABLE public.contacts
      ALTER COLUMN gender TYPE public.gender_identity
      USING gender::public.gender_identity;
  END IF;
END $$;

-- ------- 2. Helper: split a single "name" into first/last ----------------
-- Writes first word to first_name, remainder to last_name (middle names
-- go into last_name — a common, culturally-sensitive-enough default;
-- admin can edit afterwards).
-- Scalar helpers so we can use them inline in UPDATEs without LATERAL
-- (which Postgres doesn't allow to reference the target alias).
CREATE OR REPLACE FUNCTION public._first_from_name(full_name text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN trim(coalesce(full_name, '')) = '' THEN NULL
    WHEN position(' ' in trim(full_name)) = 0 THEN trim(full_name)
    ELSE trim(substring(trim(full_name) from 1 for position(' ' in trim(full_name)) - 1))
  END
$$;

CREATE OR REPLACE FUNCTION public._last_from_name(full_name text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN trim(coalesce(full_name, '')) = '' THEN NULL
    WHEN position(' ' in trim(full_name)) = 0 THEN NULL
    ELSE nullif(trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1)), '')
  END
$$;

-- ------- 3. Per-table migrations ------------------------------------------
-- Pattern per table:
--   a. ADD first_name, last_name columns (nullable)
--   b. backfill from existing single-name column
--   c. SET first_name NOT NULL (if the original name was NOT NULL)
--   d. trigger BEFORE INSERT OR UPDATE that keeps the single-name column
--      equal to first_name || ' ' || last_name so SSOT is enforced.

-- 3.1 team_members.name
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

UPDATE public.team_members
   SET first_name = public._first_from_name(name),
       last_name  = public._last_from_name(name)
 WHERE first_name IS NULL;

ALTER TABLE public.team_members
  ALTER COLUMN first_name SET NOT NULL;

CREATE OR REPLACE FUNCTION public._team_members_sync_name() RETURNS trigger AS $$
BEGIN
  NEW.name := trim(
    coalesce(NEW.first_name, '') ||
    CASE WHEN NEW.last_name IS NOT NULL AND NEW.last_name <> ''
         THEN ' ' || NEW.last_name ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_members_sync_name ON public.team_members;
CREATE TRIGGER team_members_sync_name
  BEFORE INSERT OR UPDATE OF first_name, last_name, name ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public._team_members_sync_name();

-- 3.2 event_sponsors.contact_name
ALTER TABLE public.event_sponsors
  ADD COLUMN IF NOT EXISTS contact_first_name text,
  ADD COLUMN IF NOT EXISTS contact_last_name  text;

UPDATE public.event_sponsors
   SET contact_first_name = public._first_from_name(contact_name),
       contact_last_name  = public._last_from_name(contact_name)
 WHERE contact_first_name IS NULL AND contact_name IS NOT NULL;

CREATE OR REPLACE FUNCTION public._event_sponsors_sync_contact_name() RETURNS trigger AS $$
BEGIN
  IF NEW.contact_first_name IS NOT NULL OR NEW.contact_last_name IS NOT NULL THEN
    NEW.contact_name := nullif(trim(
      coalesce(NEW.contact_first_name, '') ||
      CASE WHEN NEW.contact_last_name IS NOT NULL AND NEW.contact_last_name <> ''
           THEN ' ' || NEW.contact_last_name ELSE '' END
    ), '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_sponsors_sync_contact_name ON public.event_sponsors;
CREATE TRIGGER event_sponsors_sync_contact_name
  BEFORE INSERT OR UPDATE OF contact_first_name, contact_last_name, contact_name ON public.event_sponsors
  FOR EACH ROW EXECUTE FUNCTION public._event_sponsors_sync_contact_name();

-- 3.3 event_schedule_items.speaker_name
ALTER TABLE public.event_schedule_items
  ADD COLUMN IF NOT EXISTS speaker_first_name text,
  ADD COLUMN IF NOT EXISTS speaker_last_name  text;

UPDATE public.event_schedule_items
   SET speaker_first_name = public._first_from_name(speaker_name),
       speaker_last_name  = public._last_from_name(speaker_name)
 WHERE speaker_first_name IS NULL AND speaker_name IS NOT NULL;

CREATE OR REPLACE FUNCTION public._schedule_items_sync_speaker_name() RETURNS trigger AS $$
BEGIN
  IF NEW.speaker_first_name IS NOT NULL OR NEW.speaker_last_name IS NOT NULL THEN
    NEW.speaker_name := nullif(trim(
      coalesce(NEW.speaker_first_name, '') ||
      CASE WHEN NEW.speaker_last_name IS NOT NULL AND NEW.speaker_last_name <> ''
           THEN ' ' || NEW.speaker_last_name ELSE '' END
    ), '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS schedule_items_sync_speaker_name ON public.event_schedule_items;
CREATE TRIGGER schedule_items_sync_speaker_name
  BEFORE INSERT OR UPDATE OF speaker_first_name, speaker_last_name, speaker_name ON public.event_schedule_items
  FOR EACH ROW EXECUTE FUNCTION public._schedule_items_sync_speaker_name();

-- 3.4 incubation_applications.founder_name
ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS founder_first_name text,
  ADD COLUMN IF NOT EXISTS founder_last_name  text,
  ADD COLUMN IF NOT EXISTS founder_gender     public.gender_identity,
  ADD COLUMN IF NOT EXISTS founder_birthday   date;

UPDATE public.incubation_applications
   SET founder_first_name = public._first_from_name(founder_name),
       founder_last_name  = public._last_from_name(founder_name)
 WHERE founder_first_name IS NULL;

ALTER TABLE public.incubation_applications
  ALTER COLUMN founder_first_name SET NOT NULL;

CREATE OR REPLACE FUNCTION public._incubation_sync_founder_name() RETURNS trigger AS $$
BEGIN
  NEW.founder_name := trim(
    coalesce(NEW.founder_first_name, '') ||
    CASE WHEN NEW.founder_last_name IS NOT NULL AND NEW.founder_last_name <> ''
         THEN ' ' || NEW.founder_last_name ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS incubation_sync_founder_name ON public.incubation_applications;
CREATE TRIGGER incubation_sync_founder_name
  BEFORE INSERT OR UPDATE OF founder_first_name, founder_last_name, founder_name ON public.incubation_applications
  FOR EACH ROW EXECUTE FUNCTION public._incubation_sync_founder_name();

-- 3.5 job_applications.applicant_name
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS applicant_first_name text,
  ADD COLUMN IF NOT EXISTS applicant_last_name  text,
  ADD COLUMN IF NOT EXISTS applicant_gender     public.gender_identity,
  ADD COLUMN IF NOT EXISTS applicant_birthday   date,
  ADD COLUMN IF NOT EXISTS applicant_country    text;

UPDATE public.job_applications
   SET applicant_first_name = public._first_from_name(applicant_name),
       applicant_last_name  = public._last_from_name(applicant_name)
 WHERE applicant_first_name IS NULL;

ALTER TABLE public.job_applications
  ALTER COLUMN applicant_first_name SET NOT NULL;

CREATE OR REPLACE FUNCTION public._job_applications_sync_applicant_name() RETURNS trigger AS $$
BEGIN
  NEW.applicant_name := trim(
    coalesce(NEW.applicant_first_name, '') ||
    CASE WHEN NEW.applicant_last_name IS NOT NULL AND NEW.applicant_last_name <> ''
         THEN ' ' || NEW.applicant_last_name ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_applications_sync_applicant_name ON public.job_applications;
CREATE TRIGGER job_applications_sync_applicant_name
  BEFORE INSERT OR UPDATE OF applicant_first_name, applicant_last_name, applicant_name ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public._job_applications_sync_applicant_name();

-- 3.6 orders.recipient_name
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS recipient_first_name text,
  ADD COLUMN IF NOT EXISTS recipient_last_name  text,
  ADD COLUMN IF NOT EXISTS recipient_title      text,
  ADD COLUMN IF NOT EXISTS recipient_gender     public.gender_identity;

UPDATE public.orders
   SET recipient_first_name = public._first_from_name(recipient_name),
       recipient_last_name  = public._last_from_name(recipient_name)
 WHERE recipient_first_name IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN recipient_first_name SET NOT NULL;

CREATE OR REPLACE FUNCTION public._orders_sync_recipient_name() RETURNS trigger AS $$
BEGIN
  NEW.recipient_name := trim(
    coalesce(NEW.recipient_first_name, '') ||
    CASE WHEN NEW.recipient_last_name IS NOT NULL AND NEW.recipient_last_name <> ''
         THEN ' ' || NEW.recipient_last_name ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_sync_recipient_name ON public.orders;
CREATE TRIGGER orders_sync_recipient_name
  BEFORE INSERT OR UPDATE OF recipient_first_name, recipient_last_name, recipient_name ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._orders_sync_recipient_name();

-- 3.7 tickets.attendee_name (first/last already exist; just SSOT-ify)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS attendee_title      text,
  ADD COLUMN IF NOT EXISTS attendee_gender     public.gender_identity,
  ADD COLUMN IF NOT EXISTS attendee_birthday   date;

-- Ensure first_name populated from existing attendee_name on legacy rows.
UPDATE public.tickets
   SET attendee_first_name = public._first_from_name(attendee_name),
       attendee_last_name  = public._last_from_name(attendee_name)
 WHERE attendee_first_name IS NULL;

ALTER TABLE public.tickets
  ALTER COLUMN attendee_first_name SET NOT NULL;

CREATE OR REPLACE FUNCTION public._tickets_sync_attendee_name() RETURNS trigger AS $$
BEGIN
  NEW.attendee_name := trim(
    coalesce(NEW.attendee_first_name, '') ||
    CASE WHEN NEW.attendee_last_name IS NOT NULL AND NEW.attendee_last_name <> ''
         THEN ' ' || NEW.attendee_last_name ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_sync_attendee_name ON public.tickets;
CREATE TRIGGER tickets_sync_attendee_name
  BEFORE INSERT OR UPDATE OF attendee_first_name, attendee_last_name, attendee_name ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public._tickets_sync_attendee_name();

-- ------- 4. Gender + title on admin profiles (staff) ----------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender public.gender_identity,
  ADD COLUMN IF NOT EXISTS country text;

-- ------- 5. Gender on team_members ---------------------------------------
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS gender public.gender_identity,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS country text;

-- ------- 6. title column on contacts is already text; nothing to do. -----

COMMENT ON TYPE public.gender_identity IS
  'Canonical person-gender enum. Null = not provided. UI convention: selecting title Ms/Mrs implies female; selecting Mr implies male. Enforced client-side to keep this column honest about unknowns.';
