-- =============================================================================
-- DBC Germany — team_members.website_url
--
-- Adds a personal website URL alongside the existing linkedin_url so members
-- whose primary online presence is a portfolio site (e.g. realjaynka.com) can
-- be linked from the public team profile page and from admin.
-- Date: 2026-05-08
-- =============================================================================

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS website_url text;
