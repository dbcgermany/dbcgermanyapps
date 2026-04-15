-- =============================================================================
-- DBC Germany — Storage buckets: event-covers + team-photos
-- Follows the same admin-only-write / public-read pattern as brand-assets
-- (20260415000009). Both are 5 MB image-only.
-- Date: 2026-04-18
-- =============================================================================

-- ---------------------------------------------------------------------------
-- event-covers: hero image for events and news posts
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "event_covers_public_read" ON storage.objects;
CREATE POLICY "event_covers_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "event_covers_admin_write" ON storage.objects;
CREATE POLICY "event_covers_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-covers'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "event_covers_admin_update" ON storage.objects;
CREATE POLICY "event_covers_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "event_covers_admin_delete" ON storage.objects;
CREATE POLICY "event_covers_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- team-photos: staff + partner headshots
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-photos',
  'team-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "team_photos_public_read" ON storage.objects;
CREATE POLICY "team_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'team-photos');

DROP POLICY IF EXISTS "team_photos_admin_write" ON storage.objects;
CREATE POLICY "team_photos_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "team_photos_admin_update" ON storage.objects;
CREATE POLICY "team_photos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'team-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "team_photos_admin_delete" ON storage.objects;
CREATE POLICY "team_photos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'team-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );
