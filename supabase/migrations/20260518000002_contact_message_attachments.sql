-- =============================================================================
-- 20260518000002  contact_messages: attachments + storage bucket
-- =============================================================================
-- Add attachment support to admin contact-mail composer. Files live in a
-- private Storage bucket and the metadata is stored as JSONB on the
-- contact_messages row for the audit trail. Server actions (service role)
-- handle download/forward to Resend.
--
-- Each attachments[] element shape:
--   { path: text, filename: text, content_type: text, size_bytes: int }
-- =============================================================================

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Private bucket for attachments — never publicly readable. The compose
-- dialog uploads directly via Supabase signed URLs (server action mints them).
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-mail-attachments', 'contact-mail-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Lock the bucket down. Only authenticated users (admin staff) can use the
-- mint-and-upload flow; the service role bypasses RLS as needed.
DROP POLICY IF EXISTS "auth insert contact-mail-attachments"
  ON storage.objects;
CREATE POLICY "auth insert contact-mail-attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contact-mail-attachments');

DROP POLICY IF EXISTS "auth read contact-mail-attachments"
  ON storage.objects;
CREATE POLICY "auth read contact-mail-attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contact-mail-attachments');
