-- =============================================================================
-- Contacts: unified visitor/subscriber model backing both ticket buyers and
-- newsletter subscribers. Deduped by lower(email).
-- Date: 2026-04-16
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  first_name text,
  last_name text,
  country text,                        -- ISO 3166-1 alpha-2
  birthday date,
  gender text CHECK (gender IN ('female','male','diverse','prefer_not_to_say')),
  occupation text,
  phone text,
  -- Marketing consent (double opt-in)
  marketing_consent boolean NOT NULL DEFAULT false,
  marketing_consent_token uuid,
  marketing_consent_requested_at timestamptz,
  marketing_consent_confirmed_at timestamptz,
  marketing_consent_source text,
  marketing_consent_ip inet,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  -- External refs
  resend_contact_id text,
  -- Notes
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_marketing_active
  ON public.contacts (marketing_consent)
  WHERE unsubscribed_at IS NULL;

COMMENT ON TABLE public.contacts IS
  'Unified people store for ticket buyers, invited guests, and newsletter subscribers.';

-- updated_at trigger (reuse existing helper from news_posts migration)
DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

-- ---------------------------------------------------------------------------
-- Categories (tags)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_de text,
  name_fr text,
  description_en text,
  description_de text,
  description_fr text,
  color text,
  is_system boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_category_links (
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.contact_categories(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES public.profiles(id),
  PRIMARY KEY (contact_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_category_links_category
  ON public.contact_category_links (category_id);

-- ---------------------------------------------------------------------------
-- Seed system categories
-- ---------------------------------------------------------------------------

INSERT INTO public.contact_categories (slug, name_en, name_de, name_fr, description_en, is_system, sort_order, color) VALUES
  ('founders',        'Founders & Entrepreneurs', 'Gründer:innen',           'Fondateur·ice·s',
   'Incubation leads, applicants, cohort alumni.', true, 10, '#c8102e'),
  ('investors',       'Investors & LPs',          'Investor:innen',          'Investisseur·euse·s',
   'Fund partners, angel investors, family offices.', true, 20, '#d4a017'),
  ('mentors',         'Mentors & Advisors',       'Mentor:innen',            'Mentor·e·s',
   'Senior-operator mentor network.', true, 30, '#2f6f8f'),
  ('students',        'Students & Learners',      'Lernende',                'Apprenants',
   'Podia academy, e-learning subscribers.', true, 40, '#557153'),
  ('event_attendees', 'Event Attendees',          'Veranstaltungsgäste',     'Participant·e·s',
   'Auto-tagged by checkout; Richesses d''Afrique audience.', true, 50, '#4b4b4b'),
  ('invited_guests',  'Invited Guests',           'Eingeladene Gäste',       'Invité·e·s',
   'Comped ticket recipients, distinct from paying buyers.', true, 60, '#9b59b6'),
  ('partners',        'Partners & Sponsors',      'Partner & Sponsoren',     'Partenaires & sponsors',
   'Corporate partners, sponsors.', true, 70, '#e67e22'),
  ('press',           'Press & Media',            'Presse & Medien',         'Presse & médias',
   'Journalists, podcasts, African business outlets.', true, 80, '#34495e'),
  ('diaspora',        'Diaspora Community',       'Diaspora-Community',      'Communauté de la diaspora',
   'General audience of the African diaspora in Europe.', true, 90, '#16a085'),
  ('alumni',          'DBC Alumni',               'DBC-Alumni',              'Alumni DBC',
   'Past incubation cohort graduates.', true, 100, '#8e44ad')
ON CONFLICT (slug) DO UPDATE
  SET name_en = EXCLUDED.name_en,
      name_de = EXCLUDED.name_de,
      name_fr = EXCLUDED.name_fr,
      description_en = EXCLUDED.description_en,
      color = EXCLUDED.color,
      is_system = EXCLUDED.is_system,
      sort_order = EXCLUDED.sort_order;
