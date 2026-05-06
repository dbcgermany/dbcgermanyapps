-- =============================================================================
-- DBC Germany — Seed confirmed speakers for Richesses d'Afrique Germany 2026
--
-- 4 confirmed keynote speakers + 2 confirmed hosts. 4 keynote slots remain
-- TBC and will be added via admin once names are confirmed.
--
-- Speakers already in team_members (Diambilay, Bambi) are linked via
-- speakers.team_member_id so a single edit propagates. Tshipama, Rau,
-- Rubambura, Lungidi are external — created as standalone speakers.
--
-- Bios are intentionally short placeholders; admins replace them in the
-- speakers admin pages (or pre-fill from team_members for linked rows).
-- Photos left NULL — admins upload via AssetUpload in the speaker form.
-- Date: 2026-05-06
-- =============================================================================

DO $$
DECLARE
  v_event_id uuid := '702183da-aadb-4bae-a5af-6b13f01aaf21';
  v_diambilay_team uuid := 'ffde3b51-b84d-48ec-944f-32bfb3153c33';
  v_bambi_team uuid := 'b494d0aa-6dd8-4855-aa7a-73ae89a2fa1c';
  v_diambilay uuid;
  v_tshipama uuid;
  v_rau uuid;
  v_rubambura uuid;
  v_bambi uuid;
  v_lungidi uuid;
BEGIN
  -- ---------------------------------------------------------------------------
  -- Keynote speakers
  -- ---------------------------------------------------------------------------
  INSERT INTO public.speakers (slug, first_name, last_name, title_en, title_de, title_fr, company_en, company_de, company_fr, team_member_id, visibility)
  VALUES (
    'jean-clement-diambilay',
    'Dr. Jean-Clément', 'Diambilay',
    'Founder', 'Gründer', 'Fondateur',
    'DBC Group', 'DBC Group', 'DBC Group',
    v_diambilay_team, 'public'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_de = EXCLUDED.title_de,
    title_fr = EXCLUDED.title_fr,
    company_en = EXCLUDED.company_en,
    company_de = EXCLUDED.company_de,
    company_fr = EXCLUDED.company_fr,
    team_member_id = EXCLUDED.team_member_id,
    visibility = EXCLUDED.visibility
  RETURNING id INTO v_diambilay;

  INSERT INTO public.speakers (slug, first_name, last_name, title_en, title_de, title_fr, visibility)
  VALUES (
    'jean-claude-tshipama',
    'Jean-Claude', 'Tshipama',
    'International Coordinator · DBC',
    'International Coordinator · DBC',
    'Coordinateur international · DBC',
    'public'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_de = EXCLUDED.title_de,
    title_fr = EXCLUDED.title_fr,
    visibility = EXCLUDED.visibility
  RETURNING id INTO v_tshipama;

  INSERT INTO public.speakers (slug, first_name, last_name, title_en, title_de, title_fr, company_en, company_de, company_fr, visibility)
  VALUES (
    'mark-rau',
    'Mark', 'Rau',
    'Producer · Owner',
    'Produzent · Inhaber',
    'Producteur · Propriétaire',
    'TH Films', 'TH Films', 'TH Films',
    'public'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_de = EXCLUDED.title_de,
    title_fr = EXCLUDED.title_fr,
    company_en = EXCLUDED.company_en,
    company_de = EXCLUDED.company_de,
    company_fr = EXCLUDED.company_fr,
    visibility = EXCLUDED.visibility
  RETURNING id INTO v_rau;

  INSERT INTO public.speakers (slug, first_name, last_name, title_en, title_de, title_fr, company_en, company_de, company_fr, visibility)
  VALUES (
    'grace-rubambura',
    'Grace', 'Rubambura',
    'Co-Founder & CEO',
    'Mitgründerin & CEO',
    'Cofondatrice & CEO',
    'Tandah (Agri-Tech)', 'Tandah (Agri-Tech)', 'Tandah (Agri-Tech)',
    'public'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_de = EXCLUDED.title_de,
    title_fr = EXCLUDED.title_fr,
    company_en = EXCLUDED.company_en,
    company_de = EXCLUDED.company_de,
    company_fr = EXCLUDED.company_fr,
    visibility = EXCLUDED.visibility
  RETURNING id INTO v_rubambura;

  -- ---------------------------------------------------------------------------
  -- Hosts
  -- ---------------------------------------------------------------------------
  INSERT INTO public.speakers (slug, first_name, last_name, title_en, title_de, title_fr, team_member_id, visibility)
  VALUES (
    'ruth-bambi',
    'Ruth', 'Bambi',
    'Project Manager · Germany CEO',
    'Projektleiterin · Germany CEO',
    'Chef de projet · Germany CEO',
    v_bambi_team, 'public'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_de = EXCLUDED.title_de,
    title_fr = EXCLUDED.title_fr,
    team_member_id = EXCLUDED.team_member_id,
    visibility = EXCLUDED.visibility
  RETURNING id INTO v_bambi;

  INSERT INTO public.speakers (slug, first_name, last_name, title_en, title_de, title_fr, visibility)
  VALUES (
    'rudy-lungidi',
    'Rudy', 'Lungidi',
    'Co-Host', 'Co-Host', 'Co-animateur',
    'public'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_de = EXCLUDED.title_de,
    title_fr = EXCLUDED.title_fr,
    visibility = EXCLUDED.visibility
  RETURNING id INTO v_lungidi;

  -- ---------------------------------------------------------------------------
  -- Attach to Richesses 2026 with role labels and feature flags
  -- Featured speakers (top of page strip) = 4 keynotes
  -- Hosts = role_label "Moderator & Host" / "Co-host"; not featured
  -- ---------------------------------------------------------------------------
  INSERT INTO public.event_speakers (event_id, speaker_id, role_label_en, role_label_de, role_label_fr, is_featured, sort_order)
  VALUES
    (v_event_id, v_diambilay, 'Keynote', 'Keynote', 'Keynote', true, 10),
    (v_event_id, v_tshipama,  'Keynote', 'Keynote', 'Keynote', true, 20),
    (v_event_id, v_rau,       'Keynote', 'Keynote', 'Keynote', true, 30),
    (v_event_id, v_rubambura, 'Keynote', 'Keynote', 'Keynote', true, 40),
    (v_event_id, v_bambi,     'Moderator & Host',  'Moderation & Host',  'Modération & animation',  false, 50),
    (v_event_id, v_lungidi,   'Co-Host',           'Co-Host',            'Co-animateur',            false, 60)
  ON CONFLICT (event_id, speaker_id) DO UPDATE SET
    role_label_en = EXCLUDED.role_label_en,
    role_label_de = EXCLUDED.role_label_de,
    role_label_fr = EXCLUDED.role_label_fr,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order;
END $$;
