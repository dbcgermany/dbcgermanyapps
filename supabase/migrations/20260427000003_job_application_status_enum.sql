-- Phase B: job_applications.status text → enum.
--
-- Same 5-state triage lifecycle as incubation_application_status, but a
-- distinct enum type so future divergence doesn't require a rename. The
-- TS side (apps/admin applications status-select + job_apply.ts action)
-- already writes only these 5 values.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_application_status') THEN
    CREATE TYPE public.job_application_status AS ENUM (
      'new','reviewing','shortlisted','rejected','accepted'
    );
  END IF;
END$$;

ALTER TABLE public.job_applications
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.job_applications
  ALTER COLUMN status TYPE public.job_application_status
    USING status::public.job_application_status;

ALTER TABLE public.job_applications
  ALTER COLUMN status SET DEFAULT 'new'::public.job_application_status;
