-- =============================================================================
-- Extend upsert_contact_from_checkout() to accept p_locale.
--
-- Semantics: write `p_locale` into contacts.locale only when the column is
-- currently NULL. Once a contact has a stored preference it is the SSOT for
-- future outreach, and a later form submission in a different URL prefix
-- must not silently overwrite it (Phase D decision: existing preference wins).
--
-- This is the only writer for contacts.locale via form upserts. Admin / user
-- "Personal Preferences" flows update it explicitly with a direct UPDATE.
--
-- Date: 2026-05-13
-- =============================================================================

-- Drop the prior 9-arg signature before re-creating with the 10th param.
-- Without this, PostgREST sees two overloads and refuses to resolve calls.
DROP FUNCTION IF EXISTS public.upsert_contact_from_checkout(
  text, text, text, text, date, text, text, text, text[]
);

CREATE OR REPLACE FUNCTION public.upsert_contact_from_checkout(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_birthday date DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_occupation text DEFAULT NULL,
  p_auto_category_slug text DEFAULT 'event_attendees',
  p_extra_category_slugs text[] DEFAULT '{}',
  p_locale text DEFAULT NULL
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
  v_locale text;
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

  -- Locale is constrained to ('en','de','fr'); anything else becomes NULL.
  v_locale := NULLIF(trim(lower(p_locale)), '');
  IF v_locale IS NOT NULL AND v_locale NOT IN ('en','de','fr') THEN
    v_locale := NULL;
  END IF;

  SELECT id INTO v_contact_id
    FROM public.contacts
   WHERE lower(email) = v_normalized_email
   LIMIT 1;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.contacts (
      email, first_name, last_name, country, birthday, gender, occupation, locale
    ) VALUES (
      v_normalized_email,
      NULLIF(trim(p_first_name), ''),
      NULLIF(trim(p_last_name), ''),
      NULLIF(upper(trim(p_country)), ''),
      p_birthday,
      v_gender,
      NULLIF(trim(p_occupation), ''),
      v_locale
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.contacts
       SET first_name = COALESCE(first_name, NULLIF(trim(p_first_name), '')),
           last_name  = COALESCE(last_name,  NULLIF(trim(p_last_name),  '')),
           country    = COALESCE(country,    NULLIF(upper(trim(p_country)),    '')),
           birthday   = COALESCE(birthday,   p_birthday),
           gender     = COALESCE(gender,     v_gender),
           occupation = COALESCE(occupation, NULLIF(trim(p_occupation), '')),
           locale     = COALESCE(locale,     v_locale)
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

GRANT EXECUTE ON FUNCTION public.upsert_contact_from_checkout(
  text, text, text, text, date, text, text, text, text[], text
) TO anon, authenticated, service_role;
