-- =============================================================================
-- DBC Germany — Fast unread-notification count for the admin nav badge.
-- Uses the existing (user_id, read_at) index so it's cheap.
-- Date: 2026-04-18
-- =============================================================================

CREATE OR REPLACE FUNCTION public.count_unread_notifications()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT count(*)::int
    FROM public.notifications
   WHERE user_id = auth.uid()
     AND read_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.count_unread_notifications() TO authenticated;

COMMENT ON FUNCTION public.count_unread_notifications() IS
  'Cheap unread-count for the admin nav badge. Scoped to the calling user.';
