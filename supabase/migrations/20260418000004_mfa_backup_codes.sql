-- =============================================================================
-- DBC Germany — MFA backup codes.
-- Ten single-use codes generated when a user enables 2FA. Codes are bcrypt-
-- hashed (pgcrypto) at rest; we only verify via crypt().
-- Date: 2026-04-18
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.mfa_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user
  ON public.mfa_backup_codes (user_id)
  WHERE used_at IS NULL;

ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mfa_backup_codes_read ON public.mfa_backup_codes;
CREATE POLICY mfa_backup_codes_read ON public.mfa_backup_codes
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS mfa_backup_codes_insert ON public.mfa_backup_codes;
CREATE POLICY mfa_backup_codes_insert ON public.mfa_backup_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mfa_backup_codes_update ON public.mfa_backup_codes;
CREATE POLICY mfa_backup_codes_update ON public.mfa_backup_codes
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Helper: redeem one unused code. Returns true if redeemed, false otherwise.
-- SECURITY DEFINER so it can mark a row used atomically without RLS roundtrips.
CREATE OR REPLACE FUNCTION public.mfa_redeem_backup_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_id uuid;
BEGIN
  SELECT id INTO v_row_id
    FROM public.mfa_backup_codes
   WHERE user_id = auth.uid()
     AND used_at IS NULL
     AND code_hash = crypt(p_code, code_hash)
   LIMIT 1;

  IF v_row_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.mfa_backup_codes
     SET used_at = now()
   WHERE id = v_row_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mfa_redeem_backup_code(text) TO authenticated;

-- Helper: count remaining unused codes for the current user.
CREATE OR REPLACE FUNCTION public.mfa_unused_backup_codes()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT count(*)::int
    FROM public.mfa_backup_codes
   WHERE user_id = auth.uid()
     AND used_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.mfa_unused_backup_codes() TO authenticated;

COMMENT ON TABLE public.mfa_backup_codes IS
  'Single-use recovery codes for TOTP 2FA. Bcrypt-hashed via pgcrypto.';
