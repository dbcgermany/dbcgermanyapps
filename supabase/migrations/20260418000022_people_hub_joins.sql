-- Link event_sponsors + incubation_applications to contacts so we can view
-- sponsorship/application history on a person's profile and count people
-- per category in the sidebar.

-- =============================================================================
-- event_sponsors.contact_id — links a sponsor deal to the canonical contact
-- =============================================================================
ALTER TABLE public.event_sponsors
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_sponsors_contact_id
  ON public.event_sponsors (contact_id);

-- Backfill: match existing sponsor contact_email → contacts.email (lowercased).
-- Leaves contact_id NULL if no contact exists yet — the action handles upsert
-- on next edit and a later migration can seed missing rows.
UPDATE public.event_sponsors es
   SET contact_id = c.id
  FROM public.contacts c
 WHERE es.contact_id IS NULL
   AND es.contact_email IS NOT NULL
   AND lower(es.contact_email) = c.email;

-- Auto-tag partner contacts we just linked so the Sponsors & Partners
-- sidebar filter already has data on first load.
INSERT INTO public.contact_category_links (contact_id, category_id)
SELECT DISTINCT es.contact_id, cat.id
  FROM public.event_sponsors es
  JOIN public.contact_categories cat ON cat.slug = 'partners'
 WHERE es.contact_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- =============================================================================
-- incubation_applications.contact_id — links a founder application to the
-- canonical contact
-- =============================================================================
ALTER TABLE public.incubation_applications
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_incubation_applications_contact_id
  ON public.incubation_applications (contact_id);

UPDATE public.incubation_applications a
   SET contact_id = c.id
  FROM public.contacts c
 WHERE a.contact_id IS NULL
   AND a.founder_email IS NOT NULL
   AND lower(a.founder_email) = c.email;

INSERT INTO public.contact_category_links (contact_id, category_id)
SELECT DISTINCT a.contact_id, cat.id
  FROM public.incubation_applications a
  JOIN public.contact_categories cat ON cat.slug = 'founders'
 WHERE a.contact_id IS NOT NULL
ON CONFLICT DO NOTHING;
