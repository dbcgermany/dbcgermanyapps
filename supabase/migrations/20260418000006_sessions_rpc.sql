-- =============================================================================
-- DBC Germany — Per-session visibility + revoke for the Security tab.
-- Supabase's auth schema isn't exposed through PostgREST, so we wrap the
-- needed reads/writes in SECURITY DEFINER RPCs scoped to the calling user.
-- Date: 2026-04-18
-- =============================================================================

-- List the calling user's active sessions (most-recent first).
-- Includes session id, created_at, last_refresh_at, and the parsed
-- user-agent/IP from the accompanying refresh_tokens row when present.
CREATE OR REPLACE FUNCTION public.list_my_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  not_after timestamptz,
  aal text,
  user_agent text,
  ip text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT
    s.id,
    s.created_at,
    s.updated_at,
    s.not_after,
    s.aal::text,
    s.user_agent::text,
    s.ip::text
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_sessions() TO authenticated;

-- Revoke one specific session of the calling user. Returns true if a row
-- was deleted (i.e. the session existed and belonged to the caller).
CREATE OR REPLACE FUNCTION public.revoke_my_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM auth.sessions
   WHERE id = p_session_id
     AND user_id = auth.uid();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_my_session(uuid) TO authenticated;

COMMENT ON FUNCTION public.list_my_sessions() IS
  'Lists active Supabase Auth sessions for the calling user. Used by the admin Security tab.';
COMMENT ON FUNCTION public.revoke_my_session(uuid) IS
  'Deletes one Supabase Auth session row that belongs to the calling user.';
