-- =============================================================================
-- DBC Germany — Event Speakers (global library + per-event M2M)
--
-- One canonical speakers row reused across editions (Richesses Germany 2026
-- → 2027 → other countries) and across multiple events in the same year.
-- Optional team_member_id link lets DBC team members appear as speakers
-- without duplicating bios (admin form pre-fills from the linked team
-- member).
--
-- Plus event funnel-page columns: hero_video_url, funnel_tagline_*,
-- scarcity_threshold (controls when the "Only X left" badge fires on the
-- public sticky CTA).
--
-- All non-breaking: every existing event keeps rendering identically until
-- speakers/video are populated. event_schedule_items.speaker_name/title/
-- image_url columns stay; the new speaker_id FK is optional.
-- Date: 2026-05-06
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. speakers (global library)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  -- trilingual headline / company
  title_en text,
  title_de text,
  title_fr text,
  company_en text,
  company_de text,
  company_fr text,
  -- trilingual long bio (markdown)
  bio_en text,
  bio_de text,
  bio_fr text,
  -- media
  photo_url text,
  -- contact / social
  email text,
  linkedin_url text,
  twitter_url text,
  website_url text,
  -- optional link to internal team member (mirror of team_members.profile_id pattern)
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  -- visibility (mirrors team_members)
  visibility team_member_visibility NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.speakers IS
  'Global speakers library. One row per person; reused across events via event_speakers. Optional team_member_id pre-fills bio/photo from team_members.';

COMMENT ON COLUMN public.speakers.team_member_id IS
  'Optional FK to team_members. When set, public profile pages may inherit bio/photo from the team member.';

CREATE INDEX IF NOT EXISTS idx_speakers_visibility ON public.speakers (visibility);
CREATE INDEX IF NOT EXISTS idx_speakers_team_member_id ON public.speakers (team_member_id);

DROP TRIGGER IF EXISTS trg_speakers_updated_at ON public.speakers;
CREATE TRIGGER trg_speakers_updated_at
  BEFORE UPDATE ON public.speakers
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. event_speakers (M2M join)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_speakers (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  -- per-event role label ("Keynote", "Panelist", "Workshop host"); trilingual
  role_label_en text,
  role_label_de text,
  role_label_fr text,
  -- featured speakers appear in the above-the-fold strip on the funnel page
  is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, speaker_id)
);

COMMENT ON TABLE public.event_speakers IS
  'Many-to-many link between events and speakers. role_label is per-event (a person can be Keynote at one event, Panelist at another).';

CREATE INDEX IF NOT EXISTS idx_event_speakers_event_sort
  ON public.event_speakers (event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_event_speakers_featured
  ON public.event_speakers (event_id, is_featured)
  WHERE is_featured = true;

-- ---------------------------------------------------------------------------
-- 3. event_schedule_items.speaker_id (optional FK to canonical speaker)
-- Non-breaking: existing speaker_name / speaker_title / speaker_image_url
-- columns stay. Admins can "upgrade" an inline speaker to a canonical one
-- by setting speaker_id; the public schedule then renders SpeakerCard.
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_schedule_items
  ADD COLUMN IF NOT EXISTS speaker_id uuid
    REFERENCES public.speakers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_schedule_items_speaker_id
  ON public.event_schedule_items (speaker_id)
  WHERE speaker_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. events: funnel-page columns
-- hero_video_url        — YouTube/Vimeo URL; when set, funnel hero plays this
-- funnel_tagline_*      — short above-fold one-liner used by the funnel template
-- scarcity_threshold    — public sticky CTA shows "Only X left" when remaining <= this
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hero_video_url text,
  ADD COLUMN IF NOT EXISTS funnel_tagline_en text,
  ADD COLUMN IF NOT EXISTS funnel_tagline_de text,
  ADD COLUMN IF NOT EXISTS funnel_tagline_fr text,
  ADD COLUMN IF NOT EXISTS scarcity_threshold int NOT NULL DEFAULT 20;

COMMENT ON COLUMN public.events.scarcity_threshold IS
  'Public sticky CTA shows "Only X left" badge when a tier''s remaining stock is less than or equal to this value. Set to 0 to disable.';

-- ---------------------------------------------------------------------------
-- 5. RLS state — match the rest of the schema (disabled; access is gated by
-- requireRole() in server actions per 20260427000008_revert_rls_partial.sql).
-- We do NOT enable RLS on speakers / event_speakers to stay consistent with
-- events, team_members, event_schedule_items, etc.
-- ---------------------------------------------------------------------------
ALTER TABLE public.speakers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6. Storage bucket: speaker-photos (mirrors team-photos)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaker-photos',
  'speaker-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "speaker_photos_public_read" ON storage.objects;
CREATE POLICY "speaker_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'speaker-photos');

DROP POLICY IF EXISTS "speaker_photos_admin_write" ON storage.objects;
CREATE POLICY "speaker_photos_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'speaker-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "speaker_photos_admin_update" ON storage.objects;
CREATE POLICY "speaker_photos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'speaker-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "speaker_photos_admin_delete" ON storage.objects;
CREATE POLICY "speaker_photos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'speaker-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );
