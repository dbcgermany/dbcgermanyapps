-- =============================================================================
-- Upsert-by-email helper used by checkout + invitation flows.
-- Returns the contact_id; only fills NULL fields on existing rows so we never
-- clobber profile data the visitor previously gave us.
-- Date: 2026-04-16
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_contact_from_checkout(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_birthday date DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_occupation text DEFAULT NULL,
  p_auto_category_slug text DEFAULT 'event_attendees'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id uuid;
  v_category_id uuid;
  v_normalized_email text;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'email is required';
  END IF;
  v_normalized_email := lower(trim(p_email));

  -- Try existing
  SELECT id INTO v_contact_id
    FROM public.contacts
   WHERE lower(email) = v_normalized_email
   LIMIT 1;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.contacts (
      email, first_name, last_name, country, birthday, gender, occupation
    ) VALUES (
      v_normalized_email,
      NULLIF(trim(p_first_name), ''),
      NULLIF(trim(p_last_name), ''),
      NULLIF(trim(p_country), ''),
      p_birthday,
      NULLIF(trim(p_gender), ''),
      NULLIF(trim(p_occupation), '')
    )
    RETURNING id INTO v_contact_id;
  ELSE
    -- Only fill blanks; don't overwrite existing data
    UPDATE public.contacts
       SET first_name = COALESCE(first_name, NULLIF(trim(p_first_name), '')),
           last_name  = COALESCE(last_name,  NULLIF(trim(p_last_name),  '')),
           country    = COALESCE(country,    NULLIF(trim(p_country),    '')),
           birthday   = COALESCE(birthday,   p_birthday),
           gender     = COALESCE(gender,     NULLIF(trim(p_gender),     '')),
           occupation = COALESCE(occupation, NULLIF(trim(p_occupation), ''))
     WHERE id = v_contact_id;
  END IF;

  -- Auto-link to system category
  IF p_auto_category_slug IS NOT NULL THEN
    SELECT id INTO v_category_id
      FROM public.contact_categories
     WHERE slug = p_auto_category_slug;

    IF v_category_id IS NOT NULL THEN
      INSERT INTO public.contact_category_links (contact_id, category_id)
      VALUES (v_contact_id, v_category_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN v_contact_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contact_from_checkout(
  text, text, text, text, date, text, text, text
) TO authenticated, service_role;
