-- =============================================================================
-- DBC Germany — Per-user preferences on profiles
-- Adds: avatar_url, email_notifications, theme preference
-- Date: 2026-04-15
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system'));

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to avatar image in storage.buckets.avatars';
COMMENT ON COLUMN public.profiles.email_notifications IS 'Per-user opt-in for transactional email alerts (orders, applications, etc.)';
COMMENT ON COLUMN public.profiles.theme IS 'User UI theme preference; server reads on first paint, client hydrates.';
