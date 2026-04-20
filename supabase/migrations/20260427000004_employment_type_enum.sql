-- Phase C: job_offers.employment_type text → enum.
--
-- 4 values from the admin job-offer form: full_time, part_time, freelance,
-- internship. Column is nullable — left that way.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type') THEN
    CREATE TYPE public.employment_type AS ENUM (
      'full_time','part_time','freelance','internship'
    );
  END IF;
END$$;

ALTER TABLE public.job_offers
  ALTER COLUMN employment_type DROP DEFAULT;

ALTER TABLE public.job_offers
  ALTER COLUMN employment_type TYPE public.employment_type
    USING employment_type::public.employment_type;

ALTER TABLE public.job_offers
  ALTER COLUMN employment_type SET DEFAULT 'full_time'::public.employment_type;
