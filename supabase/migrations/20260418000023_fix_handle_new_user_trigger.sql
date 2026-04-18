-- Fix handle_new_user trigger — the old version tried to INSERT into
-- public.profiles.display_name, but display_name is a GENERATED column
-- (computed from first_name || ' ' || last_name). Inserting it directly
-- raised "cannot insert a non-DEFAULT value into column display_name"
-- whenever auth.admin.createUser() was called.
--
-- The new trigger writes first_name / last_name so display_name derives
-- naturally. If the caller only supplied display_name in user_metadata
-- (e.g. legacy callers), we split it into first/last as a fallback.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $body$
DECLARE
  v_display text := COALESCE(NEW.raw_user_meta_data ->> 'display_name', '');
  v_first   text := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
  v_last    text := COALESCE(NEW.raw_user_meta_data ->> 'last_name',  '');
BEGIN
  IF v_first = '' AND v_display <> '' THEN
    v_first := split_part(v_display, ' ', 1);
    v_last  := NULLIF(regexp_replace(v_display, '^\S+\s*', ''), '');
  END IF;

  INSERT INTO public.profiles (id, role, first_name, last_name, locale)
  VALUES (
    NEW.id,
    'buyer',
    NULLIF(v_first, ''),
    NULLIF(v_last, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'en')
  );

  RETURN NEW;
END;
$body$;
