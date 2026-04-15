-- =============================================================================
-- Count newsletter recipients given include/exclude category slug arrays.
-- Mirrors the send-time filter: consented + not unsubscribed + at least one
-- matching include category and no matching exclude category.
-- Date: 2026-04-17
-- =============================================================================

CREATE OR REPLACE FUNCTION public.count_newsletter_recipients(
  p_target_slugs text[],
  p_exclude_slugs text[] DEFAULT '{}'
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH target_cats AS (
    SELECT id FROM public.contact_categories
     WHERE slug = ANY(COALESCE(p_target_slugs, '{}'))
  ),
  exclude_cats AS (
    SELECT id FROM public.contact_categories
     WHERE slug = ANY(COALESCE(p_exclude_slugs, '{}'))
  ),
  eligible AS (
    SELECT c.id
      FROM public.contacts c
     WHERE c.marketing_consent = true
       AND c.unsubscribed_at IS NULL
       AND (
         -- no targeting provided = everyone eligible
         COALESCE(array_length(p_target_slugs, 1), 0) = 0
         OR EXISTS (
           SELECT 1 FROM public.contact_category_links l
            WHERE l.contact_id = c.id
              AND l.category_id IN (SELECT id FROM target_cats)
         )
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.contact_category_links l
          WHERE l.contact_id = c.id
            AND l.category_id IN (SELECT id FROM exclude_cats)
       )
  )
  SELECT count(*)::int FROM eligible;
$$;

GRANT EXECUTE ON FUNCTION public.count_newsletter_recipients(text[], text[])
  TO authenticated, service_role;
