-- =============================================================================
-- DBC Germany — Profiles: structured name + demographics + address
-- Adds: first_name, last_name, birthday, phone (E.164), and a Google/Stripe-
-- style address block. Converts display_name into a server-computed generated
-- column so existing code reading display_name keeps working.
-- Date: 2026-04-18
-- =============================================================================

-- 1. Add the new columns (nullable; avatars, prefs already exist).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_postal_code text,
  ADD COLUMN IF NOT EXISTS address_country text;

-- 2. Constraints.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_address_country_iso2;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_address_country_iso2
    CHECK (address_country IS NULL OR length(address_country) = 2);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_phone_e164;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_e164
    CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$');

-- 3. Backfill first_name + last_name from existing display_name.
-- Naive split on first space — reversible since we preserve display_name's
-- effective value via the generated column below.
UPDATE public.profiles
   SET first_name = COALESCE(first_name,
                    NULLIF(split_part(display_name, ' ', 1), '')),
       last_name  = COALESCE(last_name,
                    NULLIF(
                      regexp_replace(display_name, '^\S+\s*', ''),
                      ''
                    ))
 WHERE display_name IS NOT NULL
   AND (first_name IS NULL OR last_name IS NULL);

-- 4. Replace display_name with a server-computed generated column.
-- Drop first (can't swap kinds in place).
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS display_name;

ALTER TABLE public.profiles
  ADD COLUMN display_name text
    GENERATED ALWAYS AS (
      NULLIF(
        trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')),
        ''
      )
    ) STORED;

COMMENT ON COLUMN public.profiles.display_name IS
  'Server-computed from first_name + last_name. Read-only; update the source columns.';
COMMENT ON COLUMN public.profiles.first_name IS 'Given name. Source of truth for greetings / display_name.';
COMMENT ON COLUMN public.profiles.last_name IS 'Family name. Source of truth for formal sort + display_name.';
COMMENT ON COLUMN public.profiles.birthday IS 'Date of birth (ISO-8601 date). Nullable.';
COMMENT ON COLUMN public.profiles.phone IS 'Phone in E.164 format (+ country code, 8–15 digits).';
COMMENT ON COLUMN public.profiles.address_country IS 'ISO-3166-1 alpha-2 country code (uppercase).';
