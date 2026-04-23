-- =============================================================================
-- 20260429000007  notification_preferences
-- =============================================================================
-- Per-user, per-type, per-channel opt-in/out for the admin notifications
-- system. A row exists only when the user has tuned the value away from
-- the SSOT default (NOTIFICATION_DEFAULTS in @dbc/types); the fan-out in
-- notifyAdmins falls back to the default when a row is missing. So adding
-- this table doesn't flip anyone's current behaviour — existing admins
-- keep receiving every in-app notification until they touch the new UI.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  in_app            boolean NOT NULL DEFAULT true,
  email             boolean NOT NULL DEFAULT false,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS notification_preferences_type_idx
  ON public.notification_preferences(notification_type);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own prefs read"
  ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own prefs write"
  ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.notification_preferences IS
  'Per-(user, notification_type) delivery switches. Missing rows fall back to NOTIFICATION_DEFAULTS in @dbc/types.';
