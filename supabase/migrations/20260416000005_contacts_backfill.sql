-- =============================================================================
-- Backfill contacts from existing orders + tickets.
-- No marketing consent assumed — buyers must actively opt in to be subscribers.
-- Date: 2026-04-16
-- =============================================================================

-- 1. Insert one contact per unique email we've ever seen (orders + tickets).
INSERT INTO public.contacts (email, first_name, last_name, marketing_consent, marketing_consent_source)
SELECT
  lower(email_src.email) AS email,
  split_part(email_src.name, ' ', 1) AS first_name,
  NULLIF(regexp_replace(email_src.name, '^\S+\s*', ''), '') AS last_name,
  false,
  'backfill'
FROM (
  SELECT DISTINCT recipient_email AS email, recipient_name AS name
    FROM public.orders
   WHERE recipient_email IS NOT NULL
     AND recipient_email NOT LIKE 'door-sale-%@no-email.local'
  UNION
  SELECT DISTINCT attendee_email, attendee_name
    FROM public.tickets
   WHERE attendee_email IS NOT NULL
     AND attendee_email NOT LIKE 'door-sale-%@no-email.local'
) AS email_src
ON CONFLICT (email) DO NOTHING;

-- (lower-email unique index enforces conflict target — citext not used; the
-- conflict target above works because idx_contacts_email_lower is UNIQUE.)

-- 2. Wire up orders.contact_id
UPDATE public.orders o
   SET contact_id = c.id
  FROM public.contacts c
 WHERE o.contact_id IS NULL
   AND lower(o.recipient_email) = lower(c.email);

-- 3. Wire up tickets.contact_id
UPDATE public.tickets t
   SET contact_id = c.id
  FROM public.contacts c
 WHERE t.contact_id IS NULL
   AND lower(t.attendee_email) = lower(c.email);

-- 4. Auto-tag past paying buyers as event_attendees
INSERT INTO public.contact_category_links (contact_id, category_id)
SELECT DISTINCT o.contact_id, cat.id
  FROM public.orders o
  JOIN public.contact_categories cat ON cat.slug = 'event_attendees'
 WHERE o.contact_id IS NOT NULL
   AND o.acquisition_type IN ('purchased', 'door_sale')
ON CONFLICT DO NOTHING;

-- 5. Auto-tag past invited guests
INSERT INTO public.contact_category_links (contact_id, category_id)
SELECT DISTINCT o.contact_id, cat.id
  FROM public.orders o
  JOIN public.contact_categories cat ON cat.slug = 'invited_guests'
 WHERE o.contact_id IS NOT NULL
   AND o.acquisition_type IN ('invited', 'assigned')
ON CONFLICT DO NOTHING;
