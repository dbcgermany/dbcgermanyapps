-- Fix the gender-cast bug in upsert_contact_from_checkout.
--
-- The contacts.gender column is a `gender_identity` enum, but the function
-- passes p_gender (typed as text) directly into the INSERT/UPDATE list.
-- PostgreSQL refuses with `42804: column "gender" is of type
-- gender_identity but expression is of type text` even when the value is
-- NULL, because the typed expression itself is text. Add explicit casts.

CREATE OR REPLACE FUNCTION public.upsert_contact_from_checkout(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_birthday date DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_occupation text DEFAULT NULL,
  p_auto_category_slug text DEFAULT 'event_attendees',
  p_extra_category_slugs text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_category_id uuid;
  v_slug text;
  v_normalized_email text;
  v_gender public.gender_identity;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'email is required';
  END IF;
  v_normalized_email := lower(trim(p_email));

  -- Cast text -> enum once. Empty / unknown labels become NULL.
  BEGIN
    v_gender := NULLIF(trim(p_gender), '')::public.gender_identity;
  EXCEPTION WHEN invalid_text_representation THEN
    v_gender := NULL;
  END;

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
      NULLIF(upper(trim(p_country)), ''),
      p_birthday,
      v_gender,
      NULLIF(trim(p_occupation), '')
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.contacts
       SET first_name = COALESCE(first_name, NULLIF(trim(p_first_name), '')),
           last_name  = COALESCE(last_name,  NULLIF(trim(p_last_name),  '')),
           country    = COALESCE(country,    NULLIF(upper(trim(p_country)),    '')),
           birthday   = COALESCE(birthday,   p_birthday),
           gender     = COALESCE(gender,     v_gender),
           occupation = COALESCE(occupation, NULLIF(trim(p_occupation), ''))
     WHERE id = v_contact_id;
  END IF;

  -- Auto-link to the system category (legacy single-slug param)
  IF p_auto_category_slug IS NOT NULL AND length(trim(p_auto_category_slug)) > 0 THEN
    SELECT id INTO v_category_id
      FROM public.contact_categories
     WHERE slug = p_auto_category_slug;

    IF v_category_id IS NOT NULL THEN
      INSERT INTO public.contact_category_links (contact_id, category_id)
      VALUES (v_contact_id, v_category_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Extra categories (typically bulk-invite CSV imports)
  IF p_extra_category_slugs IS NOT NULL THEN
    FOREACH v_slug IN ARRAY p_extra_category_slugs LOOP
      IF v_slug IS NULL OR length(trim(v_slug)) = 0 THEN
        CONTINUE;
      END IF;
      SELECT id INTO v_category_id
        FROM public.contact_categories
       WHERE slug = trim(v_slug);
      IF v_category_id IS NOT NULL THEN
        INSERT INTO public.contact_category_links (contact_id, category_id)
        VALUES (v_contact_id, v_category_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_contact_id;
END;
$$;
