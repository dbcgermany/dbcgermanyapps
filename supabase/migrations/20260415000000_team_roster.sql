-- =============================================================================
-- Update DBC Germany team roster:
-- - Hide the parent-org founder from /team (stays internal, still on /about)
-- - Update Ruth Bambi + Jay N Kalala titles
-- - Add Ruth Mayala + Vanessa Bambi
-- Date: 2026-04-15
-- =============================================================================

-- Founder → internal (he's featured on /about under parent org, not /team)
UPDATE public.team_members
  SET visibility = 'internal'
  WHERE slug = 'jean-clement-diambilay';

-- Ruth Bambi — Project Manager and Subsidiary Manager
UPDATE public.team_members
  SET role_en = 'Project Manager · Subsidiary Manager',
      role_de = 'Projektmanagerin · Niederlassungsleitung',
      role_fr = 'Chef de projet · Directrice de filiale',
      sort_order = 20
  WHERE slug = 'ruth-bambi';

-- Jay N Kalala — Sales, Sponsoring, Digitalization
UPDATE public.team_members
  SET role_en = 'Sales Manager · Sponsoring & Digitalization',
      role_de = 'Sales Manager · Sponsoring & Digitalisierung',
      role_fr = 'Responsable ventes · sponsoring et digitalisation',
      sort_order = 30
  WHERE slug = 'jay-n-kalala';

-- Ruth Mayala — Operations and Event Manager
INSERT INTO public.team_members
  (slug, name, role_en, role_de, role_fr, sort_order, visibility)
VALUES (
  'ruth-mayala',
  'Ruth Mayala',
  'Operations & Event Manager',
  'Operations- & Event-Managerin',
  'Responsable opérations & événements',
  10,
  'public'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      role_en = EXCLUDED.role_en,
      role_de = EXCLUDED.role_de,
      role_fr = EXCLUDED.role_fr,
      sort_order = EXCLUDED.sort_order,
      visibility = 'public';

-- Vanessa Bambi — Community and Members Management
INSERT INTO public.team_members
  (slug, name, role_en, role_de, role_fr, sort_order, visibility)
VALUES (
  'vanessa-bambi',
  'Vanessa Bambi',
  'Community & Members Management',
  'Community- & Mitgliedermanagement',
  'Communauté & gestion des membres',
  40,
  'public'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      role_en = EXCLUDED.role_en,
      role_de = EXCLUDED.role_de,
      role_fr = EXCLUDED.role_fr,
      sort_order = EXCLUDED.sort_order,
      visibility = 'public';
