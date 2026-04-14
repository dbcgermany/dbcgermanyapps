-- =============================================================================
-- DBC Germany — Public-facing team members (DB-backed /team page)
-- Date: 2026-04-14
-- =============================================================================

CREATE TYPE team_member_visibility AS ENUM ('public', 'internal', 'hidden');

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  role_en text NOT NULL,
  role_de text,
  role_fr text,
  bio_en text,
  bio_de text,
  bio_fr text,
  photo_url text,
  email text,
  linkedin_url text,
  sort_order integer NOT NULL DEFAULT 0,
  visibility team_member_visibility NOT NULL DEFAULT 'internal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.team_members IS
  'Team profiles for the public /team page. visibility=public is shown on the marketing site, internal is admin-only, hidden archives the row.';

CREATE INDEX IF NOT EXISTS idx_team_members_visibility_sort
  ON public.team_members (visibility, sort_order);

DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

-- Seed the three known team members as public (slugs are stable keys the site
-- reads; missing DB seeds would leave /team empty on first deploy).
INSERT INTO public.team_members
  (slug, name, role_en, role_de, role_fr, bio_en, bio_de, bio_fr, email, sort_order, visibility)
VALUES
  (
    'jean-clement-diambilay',
    'Dr. Jean-Clément Diambilay',
    'Founder · DBC Group',
    'Gründer · DBC Group',
    'Fondateur · DBC Group',
    'Founder of Diambilay Business Center (Lubumbashi) and of DBC France SAS. Drives the DBC vision to raise a generation of prosperous African entrepreneurs.',
    'Gründer des Diambilay Business Center (Lubumbashi) und der DBC France SAS. Treibt die DBC-Vision voran, eine Generation erfolgreicher afrikanischer Unternehmer:innen aufzubauen.',
    'Fondateur du Diambilay Business Center (Lubumbashi) et de DBC France SAS. Porte la vision DBC d''élever une génération d''entrepreneurs africains prospères.',
    NULL,
    10,
    'public'
  ),
  (
    'ruth-bambi',
    'Ruth Bambi',
    'Project Manager · Germany CEO',
    'Projektleiterin · Germany CEO',
    'Chef de projet · Germany CEO',
    'Leads DBC Germany day-to-day. Single point of contact for German partners, sponsors, and DACH entrepreneurs joining DBC programmes.',
    'Leitet das Tagesgeschäft von DBC Germany. Ansprechpartnerin für deutsche Partner, Sponsoren und DACH-Gründer:innen, die an DBC-Programmen teilnehmen.',
    'Dirige le quotidien de DBC Germany. Point de contact pour les partenaires allemands, sponsors et entrepreneurs DACH rejoignant les programmes DBC.',
    NULL,
    20,
    'public'
  ),
  (
    'jay-n-kalala',
    'Jay N Kalala',
    'Sales & Sponsorship Lead · V.i.S.d.P.',
    'Sales- & Sponsoring-Lead · V.i.S.d.P.',
    'Responsable ventes & sponsoring · V.i.S.d.P.',
    'Heads sponsorship for Richesses d''Afrique Essen 2026 and oversees the digital platforms. Editorially responsible for site content per § 55 RStV.',
    'Verantwortet das Sponsoring für Richesses d''Afrique Essen 2026 und die digitalen Plattformen. Redaktionell verantwortlich gemäß § 55 RStV.',
    'Responsable du sponsoring de Richesses d''Afrique Essen 2026 et des plateformes numériques. Responsable éditorial selon § 55 RStV.',
    'jay@dbc-germany.com',
    30,
    'public'
  )
ON CONFLICT (slug) DO NOTHING;
