-- =============================================================================
-- DBC Germany — Helpers for seeding MFA backup codes from server actions.
-- Storing hashes with crypt() requires the server to call into SQL so the
-- plaintext never leaves the session.
-- Date: 2026-04-18
-- =============================================================================

-- Insert a single hashed backup code for the current user. Returns the row id.
CREATE OR REPLACE FUNCTION public.mfa_insert_backup_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 4 THEN
    RAISE EXCEPTION 'code is required';
  END IF;

  INSERT INTO public.mfa_backup_codes (user_id, code_hash)
  VALUES (auth.uid(), crypt(p_code, gen_salt('bf', 10)))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mfa_insert_backup_code(text) TO authenticated;

-- Seed an array of codes in one call (preferred).
CREATE OR REPLACE FUNCTION public.mfa_seed_backup_codes(p_codes text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_count integer := 0;
BEGIN
  IF p_codes IS NULL OR array_length(p_codes, 1) IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH v_code IN ARRAY p_codes LOOP
    IF length(trim(v_code)) >= 4 THEN
      INSERT INTO public.mfa_backup_codes (user_id, code_hash)
      VALUES (auth.uid(), crypt(v_code, gen_salt('bf', 10)));
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mfa_seed_backup_codes(text[]) TO authenticated;
