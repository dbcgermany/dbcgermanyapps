-- Authors as SSOT person-credits: link an author row to a speaker or an admin
-- profile, in addition to the existing team_member_id link.
--
-- An `authors` row backed by a person (team member / speaker / profile) is a
-- THIN credit record: only display_name + the backing FK + type are stored;
-- the canonical photo / role / bio live in the linked entity and are resolved
-- live on the public site. The partial-unique indexes guarantee at most one
-- author row per person, so re-crediting the same team member/speaker/admin
-- never creates a duplicate (the news editor's find-or-create relies on this).
-- Additive. RLS NOT enabled (matches authors / news_posts convention).

ALTER TABLE public.authors
  ADD COLUMN IF NOT EXISTS speaker_id uuid
    REFERENCES public.speakers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL;

-- One author per backing person. Partial indexes so multiple standalone
-- authors (all NULL FKs) remain allowed.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_authors_team_member
  ON public.authors (team_member_id) WHERE team_member_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_authors_speaker
  ON public.authors (speaker_id) WHERE speaker_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_authors_profile
  ON public.authors (profile_id) WHERE profile_id IS NOT NULL;
