-- Phase A only: event_sponsors.tier + event_sponsors.status text → enum.
--
-- Verified 2026-04-20: both columns currently empty (no rows) in prod, so
-- the ALTER TYPE cast needs no normalisation. The TS side already writes
-- only values from SPONSOR_TIER_VALUES / SPONSOR_STATUS_VALUES, so this
-- migration is purely tightening the DB-level guarantee.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsor_tier') THEN
    CREATE TYPE public.sponsor_tier AS ENUM (
      'title','platinum','gold','silver','bronze','partner','media'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsor_status') THEN
    CREATE TYPE public.sponsor_status AS ENUM (
      'lead','proposal','confirmed','active','completed'
    );
  END IF;
END$$;

ALTER TABLE public.event_sponsors
  ALTER COLUMN tier   DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.event_sponsors
  ALTER COLUMN tier   TYPE public.sponsor_tier   USING tier::public.sponsor_tier,
  ALTER COLUMN status TYPE public.sponsor_status USING status::public.sponsor_status;

ALTER TABLE public.event_sponsors
  ALTER COLUMN tier   SET DEFAULT 'partner'::public.sponsor_tier,
  ALTER COLUMN status SET DEFAULT 'lead'::public.sponsor_status;
