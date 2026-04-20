-- =============================================================================
-- 20260428000001  incubation_wizard_fields
-- =============================================================================
-- Extends `public.incubation_applications` with the richer diagnostic profile
-- captured by the new 7-page wizard under `(funnels)/services/incubation/apply`.
-- Every column is nullable / defaulted so existing rows remain valid and the
-- rollout is backwards-compatible with any client still submitting the legacy
-- single-page form.
--
-- See also:
--   packages/types/src/index.ts  (INCUBATION_PROFILE_TYPES etc. — SSOT mirrors)
-- =============================================================================

-- --------------------------- Page 1: identity --------------------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS founder_age integer
    CHECK (founder_age IS NULL OR (founder_age BETWEEN 14 AND 120));

-- --------------------------- Page 2: profile ---------------------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS profile_type text
    CHECK (profile_type IS NULL OR profile_type IN (
      'project_holder', 'entrepreneur', 'student', 'investor', 'other'
    )),
  ADD COLUMN IF NOT EXISTS profile_type_other text,
  ADD COLUMN IF NOT EXISTS has_idea boolean;

-- ------------------- Page 3: idea details (conditional) ----------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS idea_problem text,
  ADD COLUMN IF NOT EXISTS idea_audience text,
  ADD COLUMN IF NOT EXISTS idea_development_stage text,
  ADD COLUMN IF NOT EXISTS idea_ambitions text;

-- --------------------------- Page 4: sectors ---------------------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS industry_sectors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industry_sectors_other text,
  ADD COLUMN IF NOT EXISTS has_prior_accompaniment boolean;

-- -------------------------- Page 5: expectations -----------------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS services_wanted text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services_wanted_other text,
  ADD COLUMN IF NOT EXISTS why_join text,
  ADD COLUMN IF NOT EXISTS diaspora_link boolean;

-- ------------------ Page 6: diaspora origin (conditional) --------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS diaspora_origin_country text;

-- ------------------------- Page 7: discovery ---------------------------------

ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS heard_about_us text
    CHECK (heard_about_us IS NULL OR heard_about_us IN (
      'social_media', 'event', 'word_of_mouth', 'media', 'other'
    )),
  ADD COLUMN IF NOT EXISTS heard_about_us_other text;

-- ------------ Loosen `pitch` so "has_idea = false" applicants pass -----------
-- The wizard accepts applicants who don't yet have an idea. The legacy form's
-- `pitch` requirement still holds for anyone with an idea (enforced in the
-- server action), but the DB constraint is relaxed to allow the no-idea path.

ALTER TABLE public.incubation_applications
  ALTER COLUMN pitch DROP NOT NULL;
