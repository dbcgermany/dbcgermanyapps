-- =============================================================================
-- DBC Germany — Link team_members to auth profiles (unified People model)
-- A person has ONE team_members row.
-- If they have login, profile_id points to their auth profile.
-- Public /team shows rows where visibility='public'.
-- Date: 2026-04-15
-- =============================================================================

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS profile_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_profile_id_unique
  ON public.team_members (profile_id)
  WHERE profile_id IS NOT NULL;

COMMENT ON COLUMN public.team_members.profile_id IS
  'Optional FK to profiles for team members who also have admin-panel login. NULL for team-only (no login) people.';
