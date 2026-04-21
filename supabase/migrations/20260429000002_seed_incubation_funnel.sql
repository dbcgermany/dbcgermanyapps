-- =============================================================================
-- 20260429000002  seed_incubation_funnel
-- =============================================================================
-- Seeds the incubation funnel as the first row of the new dynamic funnel
-- system. Preserves the current minimal experience (eyebrow + title +
-- WizardShell) from the old hand-coded page at
-- apps/site/src/app/[locale]/(funnels)/services/incubation/apply/page.tsx
-- which the site app deletes in the same ship.
--
-- After this ship, /services/incubation/apply 308-redirects to
-- /f/incubation and the dynamic renderer takes over.
-- =============================================================================

INSERT INTO public.funnels (
  slug,
  status,
  cta_type,
  cta_href,
  content_en,
  content_de,
  content_fr,
  published_at
) VALUES (
  'incubation',
  'published',
  'incubation_wizard',
  NULL,
  jsonb_build_object(
    'hero', jsonb_build_object(
      'eyebrow',    'Apply · DBC Germany',
      'title',      'Build your business with DBC.',
      'primaryCta', 'Start your application'
    )
  ),
  jsonb_build_object(
    'hero', jsonb_build_object(
      'eyebrow',    'Bewerben · DBC Germany',
      'title',      'Bau dein Unternehmen mit DBC.',
      'primaryCta', 'Bewerbung starten'
    )
  ),
  jsonb_build_object(
    'hero', jsonb_build_object(
      'eyebrow',    'Candidature · DBC Germany',
      'title',      'Construis ton entreprise avec DBC.',
      'primaryCta', 'Commencer ma candidature'
    )
  ),
  now()
)
ON CONFLICT (slug) DO NOTHING;
