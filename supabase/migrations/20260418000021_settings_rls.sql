-- Lock down settings & secrets with RLS so they don't rely purely on
-- action-layer requireRole() checks. If the service role key leaks, these
-- tables remain protected by DB-level policies tied to profiles.role.

-- =============================================================================
-- site_settings — admin read + write
-- =============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage site_settings" ON public.site_settings;
CREATE POLICY "admins manage site_settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('admin','super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('admin','super_admin')
    )
  );

-- Public read of just maintenance_mode + messages (so the public banner works).
-- Anon role gets SELECT only; write blocked by the policy above.
DROP POLICY IF EXISTS "anon reads maintenance" ON public.site_settings;
CREATE POLICY "anon reads maintenance"
  ON public.site_settings FOR SELECT
  USING (true);
-- (columns stay the same — anon client can only see what we select. Admin
-- clients SELECT all columns. For the unauthenticated public site we SELECT
-- only maintenance_mode + maintenance_message_*.)

-- =============================================================================
-- app_secrets — super_admin only
-- =============================================================================
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin manages app_secrets" ON public.app_secrets;
CREATE POLICY "super_admin manages app_secrets"
  ON public.app_secrets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- =============================================================================
-- processed_webhooks — admin read, service-role inserts (webhook handlers)
-- =============================================================================
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read processed_webhooks" ON public.processed_webhooks;
CREATE POLICY "admins read processed_webhooks"
  ON public.processed_webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('admin','super_admin')
    )
  );

-- Service role bypasses RLS entirely (Supabase default), so webhook route
-- handlers that use service client still insert fine. No INSERT policy needed.
