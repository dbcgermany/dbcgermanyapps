-- =============================================================================
-- Seed the real day-of program for Richesses d'Afrique Germany 2026 from the
-- 2026-05-02 PDF Ruth Mayala shared. Wipes any existing program rows for
-- this event and inserts 20 canonical rows with proper times, locations,
-- public/internal flags, multilingual titles, and FK links to speakers /
-- team members where the PDF named someone.
--
-- Time convention: PDF times are local wall-clock at Messe Essen (Europe/Berlin).
-- Stored as timestamptz with +00 because that's how Ruth's nine pre-existing
-- rows were already stored (datetime-local input → server UTC convert →
-- displayed back via toLocaleTimeString without tz override). Matching the
-- convention keeps everything rendering at the right wall-clock numbers
-- across the admin + PDF + public agenda.
--
-- Re-runnable: DELETE-and-replace inside a transaction. Any prior FK links
-- from event_checklist_items.runsheet_item_id or event_expenses.runsheet_item_id
-- are captured by sort_order before the delete and re-attached after the
-- new rows land at the same sort positions.
--
-- Date: 2026-05-25
-- =============================================================================

BEGIN;

-- 0. Make sure Pasteur Matthieu Yombo exists in the speakers library — the
-- PDF assigns him a 90-min slot. Use ON CONFLICT to stay idempotent.
INSERT INTO public.speakers (slug, first_name, last_name, visibility)
VALUES ('matthieu-yombo', 'Pasteur Matthieu', 'Yombo', 'internal')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  v_event_id          uuid := '702183da-aadb-4bae-a5af-6b13f01aaf21';
  v_day_iso           text := '2026-06-13';

  v_team_ruth_mayala  uuid;
  v_team_ruth_bambi   uuid;
  v_team_jay_kalala   uuid;
  v_team_vanessa      uuid;

  v_sp_diambilay      uuid;
  v_sp_tshipama       uuid;
  v_sp_rudy           uuid;
  v_sp_yombo          uuid;
BEGIN
  -- Resolve canonical-person IDs (skipping any that don't exist; we'll fall
  -- back to free-text owner if the row resolves to NULL).
  SELECT id INTO v_team_ruth_mayala  FROM public.team_members WHERE slug = 'ruth-mayala';
  SELECT id INTO v_team_ruth_bambi   FROM public.team_members WHERE slug = 'ruth-bambi';
  SELECT id INTO v_team_jay_kalala   FROM public.team_members WHERE slug = 'jay-n-kalala';
  SELECT id INTO v_team_vanessa      FROM public.team_members WHERE slug = 'vanessa-bambi';

  SELECT id INTO v_sp_diambilay      FROM public.speakers     WHERE slug = 'jean-clement-diambilay';
  SELECT id INTO v_sp_tshipama       FROM public.speakers     WHERE slug = 'jean-claude-tshipama';
  SELECT id INTO v_sp_rudy           FROM public.speakers     WHERE slug = 'rudy-lungidi';
  SELECT id INTO v_sp_yombo          FROM public.speakers     WHERE slug = 'matthieu-yombo';

  -- 1. Capture prior expense/checklist links by sort_order so we can rewire
  -- them after the DELETE-and-replace.
  CREATE TEMP TABLE IF NOT EXISTS _prior_links (
    sort_order int,
    expense_id uuid,
    checklist_id uuid
  ) ON COMMIT DROP;

  INSERT INTO _prior_links (sort_order, expense_id, checklist_id)
  SELECT r.sort_order, e.id, c.id
  FROM public.event_runsheet_items r
  LEFT JOIN public.event_expenses          e ON e.runsheet_item_id   = r.id
  LEFT JOIN public.event_checklist_items   c ON c.runsheet_item_id   = r.id
  WHERE r.event_id = v_event_id;

  -- 2. Wipe existing program rows for this event (user explicitly said
  -- "Delete what is there and replace all").
  DELETE FROM public.event_runsheet_items WHERE event_id = v_event_id;

  -- 3. Insert the 20-row PDF program (single big INSERT, deterministic
  -- sort_order so the cross-link restore below works).
  INSERT INTO public.event_runsheet_items
    (event_id, sort_order, is_public, status,
     starts_at, ends_at,
     title, title_de, title_fr,
     description, description_de, description_fr,
     notes, location_note, responsible_person,
     team_member_id, speaker_id)
  VALUES
  -- 1. Setup & Technology  (internal)
  (v_event_id, 10, false, 'pending',
   (v_day_iso || ' 07:00:00')::timestamptz, (v_day_iso || ' 09:00:00')::timestamptz,
   'Setup & Technology', 'Aufbau & Technik', 'Installation & technique',
   'Stage, lighting, sound, registration, seating',
   'Bühne, Licht, Ton, Registrierung, Bestuhlung',
   'Scène, lumière, son, enregistrement, places',
   E'06:30 DBC Technique-Coordinateur → Ruth M. (Event-Coordinatrice). Alex (247films) + Micaël arrive 06:30.',
   'Hall Europa, Messe Essen', NULL,
   v_team_ruth_mayala, NULL),
  -- 2. Hall access — team & exhibitors  (internal)
  (v_event_id, 20, false, 'pending',
   (v_day_iso || ' 08:00:00')::timestamptz, NULL,
   'Hall access — team & exhibitors', 'Halleneinlass — Team & Aussteller', 'Accès salle — équipe & exposants',
   'DBC Germany team & exhibitors enter the building',
   'DBC Germany Team & Aussteller betreten das Gebäude',
   'L''équipe DBC Germany et les exposants entrent dans le bâtiment',
   NULL,
   'Lobby / Hall Europa', NULL,
   NULL, NULL),
  -- 3. Speaker preparation  (internal)
  (v_event_id, 30, false, 'pending',
   (v_day_iso || ' 09:50:00')::timestamptz, (v_day_iso || ' 10:10:00')::timestamptz,
   'Speaker preparation', 'Speaker-Vorbereitung', 'Préparation des intervenants',
   'DBC speaker groups 1, 2, 3',
   'DBC-Speaker-Gruppen 1, 2, 3',
   'Groupes d''intervenants DBC 1, 2, 3',
   NULL,
   'Hall Berlin, Messe Essen', NULL,
   NULL, NULL),
  -- 4. Arrival & Registration  (public)
  (v_event_id, 40, true, 'pending',
   (v_day_iso || ' 10:00:00')::timestamptz, (v_day_iso || ' 10:45:00')::timestamptz,
   'Arrival & Registration', 'Ankunft & Registrierung', 'Arrivée & enregistrement',
   'QR check-in in the foyer, networking, red carpet, workshop tables open',
   'QR-Check-in im Foyer, Networking, roter Teppich, Workshop-Tische offen',
   'Enregistrement QR au foyer, networking, tapis rouge, tables d''atelier ouvertes',
   E'Doors open, foyer registration active, QR check-in, red carpet active, jazz live on stage. Hostess crew: 2× scan (Business/Premium/Standard), 1× VIP, 2× Premium.',
   'Lobby / Hall Europa', NULL,
   NULL, NULL),
  -- 5. Arrival Experience — Live Music  (public)
  (v_event_id, 50, true, 'pending',
   (v_day_iso || ' 10:00:00')::timestamptz, (v_day_iso || ' 10:45:00')::timestamptz,
   'Arrival Experience — Live Music', 'Empfang — Live-Musik', 'Accueil — musique live',
   'Live jazz performance during guest arrival',
   'Live-Jazz während der Gäste-Ankunft',
   'Performance jazz live pendant l''arrivée des invités',
   'Live jazz performance, warm lighting, open seating, ambient volume.',
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 6. Soft Opening Content  (internal)
  (v_event_id, 60, false, 'pending',
   (v_day_iso || ' 10:35:00')::timestamptz, (v_day_iso || ' 10:55:00')::timestamptz,
   'Soft Opening Content', 'Soft Opening', 'Soft Opening',
   'Short welcome slides (no moderator), visual projections',
   'Kurze Begrüßungsslides (ohne Moderation), visuelle Projektionen',
   'Slides courtes de bienvenue (sans modérateur), projections visuelles',
   'Music fade-out, lighting transition, doors close quietly, audience seated, opening standby.',
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 7. VIP arrival — Dr. J-C + spouse  (internal)
  (v_event_id, 70, false, 'pending',
   (v_day_iso || ' 10:35:00')::timestamptz, (v_day_iso || ' 10:40:00')::timestamptz,
   'VIP arrival — Dr. J-C + spouse', 'VIP-Ankunft — Dr. J-C + Ehefrau', 'Arrivée VIP — Dr. J-C + épouse',
   'Entry with car, photographer on the red carpet',
   'Ankunft mit Auto, Fotograf auf dem roten Teppich',
   'Arrivée en voiture, photographe sur le tapis rouge',
   'Moderateur Rudy für das Opening bereit. Rolls Royce Mietwagen organisieren.',
   'Lobby', NULL,
   NULL, v_sp_diambilay),
  -- 8. Dr. J-C — Media time  (internal)
  (v_event_id, 80, false, 'pending',
   (v_day_iso || ' 10:40:00')::timestamptz, (v_day_iso || ' 10:50:00')::timestamptz,
   'Dr. J-C — Media time', 'Dr. J-C — Medien', 'Dr. J-C — Temps presse',
   'Red carpet, interview, check-in',
   'Roter Teppich, Interview, Check-in',
   'Tapis rouge, interview, check-in',
   'Fotowand bestellen: DBC Belgique/France fragen + Badges.',
   'Lobby', NULL,
   NULL, v_sp_diambilay),
  -- 9. Settle phase / Transition  (internal)
  (v_event_id, 90, false, 'pending',
   (v_day_iso || ' 10:45:00')::timestamptz, (v_day_iso || ' 10:55:00')::timestamptz,
   'Settle phase / Transition', 'Übergang', 'Transition',
   'Final preparations for opening',
   'Letzte Vorbereitungen für die Eröffnung',
   'Dernières préparations pour l''ouverture',
   'Music fade-out, lighting to stage focus, doors close quietly, audience seated, opening standby.',
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 10. Official Opening  (public)
  (v_event_id, 100, true, 'pending',
   (v_day_iso || ' 11:00:00')::timestamptz, (v_day_iso || ' 11:15:00')::timestamptz,
   'Official Opening', 'Offizielle Eröffnung', 'Ouverture officielle',
   'Welcome, introduction, masterclass opening',
   'Begrüßung, Einführung, Masterclass-Eröffnung',
   'Bienvenue, introduction, ouverture de la masterclass',
   'Opening music cue, host mic on, stage lights full focus, recording start.',
   'Hall Europa, Messe Essen', NULL,
   NULL, v_sp_rudy),
  -- 11. Speaker Introductions  (public)
  (v_event_id, 110, true, 'pending',
   (v_day_iso || ' 11:15:00')::timestamptz, (v_day_iso || ' 11:30:00')::timestamptz,
   'Speaker Introductions', 'Vorstellung der Sprecher', 'Présentation des intervenants',
   'Introduction of the day''s speakers & experts',
   'Vorstellung der Sprecher:innen und Expert:innen des Tages',
   'Présentation des intervenants et expert·es du jour',
   NULL,
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 12. Keynotes  (public)
  (v_event_id, 120, true, 'pending',
   (v_day_iso || ' 11:30:00')::timestamptz, (v_day_iso || ' 12:30:00')::timestamptz,
   'Keynotes — Business & Politics', 'Keynotes — Wirtschaft & Politik', 'Keynotes — Business & Politique',
   'International speakers on business & politics',
   'Internationale Sprecher:innen zu Wirtschaft & Politik',
   'Intervenants internationaux sur le business et la politique',
   NULL,
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 13. Networking break (12:30–13:00)  (public)
  (v_event_id, 130, true, 'pending',
   (v_day_iso || ' 12:30:00')::timestamptz, (v_day_iso || ' 13:00:00')::timestamptz,
   'Networking break', 'Networking-Pause', 'Pause networking',
   'Networking & refreshments',
   'Networking & Erfrischungen',
   'Networking & rafraîchissements',
   'DANSE (Ruth M. fragt nach) → fallback: live music (P. Guylain).',
   'Lobby', NULL,
   v_team_ruth_mayala, NULL),
  -- 14. Panels & Discussions  (public)
  (v_event_id, 140, true, 'pending',
   (v_day_iso || ' 13:00:00')::timestamptz, (v_day_iso || ' 14:15:00')::timestamptz,
   'Panels — Economy, Investment, Africa-Europe',
   'Panels — Wirtschaft, Investitionen, Afrika-Europa',
   'Panels — Économie, investissement, Afrique-Europe',
   'Economy, investment, Africa-Europe discussions',
   'Wirtschaft, Investitionen, Afrika-Europa-Diskussionen',
   'Discussions économie, investissement, Afrique-Europe',
   NULL,
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 15. Q&A  (public)
  (v_event_id, 150, true, 'pending',
   (v_day_iso || ' 14:15:00')::timestamptz, (v_day_iso || ' 14:45:00')::timestamptz,
   'Q&A with speakers', 'Q&A mit den Sprechern', 'Questions-Réponses',
   'Audience exchange with the speakers',
   'Austausch mit dem Publikum',
   'Échanges entre le public et les intervenants',
   NULL,
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 16. Networking break (14:45–15:00)  (public)
  (v_event_id, 160, true, 'pending',
   (v_day_iso || ' 14:45:00')::timestamptz, (v_day_iso || ' 15:00:00')::timestamptz,
   'Networking break', 'Networking-Pause', 'Pause networking',
   'Networking with live music in Hall Europa',
   'Networking mit Live-Musik in der Halle Europa',
   'Networking avec musique live dans la Halle Europa',
   '*** CATERING SERVICE AKTIVIEREN (Premium & VIP) ***',
   'Lobby', NULL,
   NULL, NULL),
  -- 17. Pitch DBC Germany — November 2026  (public)
  (v_event_id, 170, true, 'pending',
   (v_day_iso || ' 15:00:00')::timestamptz, (v_day_iso || ' 15:45:00')::timestamptz,
   'Pitch DBC Germany — November 2026',
   'Pitch DBC Germany — November 2026',
   'Pitch DBC Germany — Novembre 2026',
   'Win-card pitch for the November 2026 event. Co-pitched with Dr. J-C Diambilay.',
   'Gewinnkarten-Pitch für die nächste Veranstaltung im November 2026. Co-Pitch mit Dr. J-C Diambilay.',
   'Pitch « carte gagnante » pour la prochaine édition de novembre 2026. Co-présenté avec Dr. J-C Diambilay.',
   'Mr. Tshipama (primary) + Dr. Diambilay co-pitch.',
   'Hall Europa, Messe Essen', NULL,
   NULL, v_sp_tshipama),
  -- 18. Official Closing  (public)
  (v_event_id, 180, true, 'pending',
   (v_day_iso || ' 15:45:00')::timestamptz, (v_day_iso || ' 16:00:00')::timestamptz,
   'Official Closing of Masterclass',
   'Offizielles Schlusswort der Masterclass',
   'Clôture officielle de la masterclass',
   'Summary & thanks',
   'Zusammenfassung & Dank',
   'Synthèse & remerciements',
   NULL,
   'Hall Europa, Messe Essen', NULL,
   NULL, NULL),
  -- 19. DBC Germany team debrief  (internal)
  (v_event_id, 190, false, 'pending',
   (v_day_iso || ' 16:15:00')::timestamptz, (v_day_iso || ' 16:30:00')::timestamptz,
   'DBC Germany team debrief', 'DBC Germany Team-Debrief', 'Debrief équipe DBC Germany',
   'Feedback + closure, photos, symbolic gift distribution',
   'Feedback + Abschluss, Fotos, symbolische Geschenkverteilung',
   'Retour + clôture, photos, distribution symbolique des cadeaux',
   'Dankeschön, Bilder, Geschenkverteilung als Symbol (Motivation für nächste Veranstaltung).',
   'Hall Europa, Messe Essen', NULL,
   v_team_ruth_mayala, NULL),
  -- 20. Pasteur Matthieu Yombo — closing blessing  (internal)
  (v_event_id, 200, false, 'pending',
   (v_day_iso || ' 16:30:00')::timestamptz, (v_day_iso || ' 18:00:00')::timestamptz,
   'Pasteur Matthieu Yombo — closing blessing',
   'Pasteur Matthieu Yombo — Schlusssegen',
   'Pasteur Matthieu Yombo — bénédiction de clôture',
   'Pastoral closing session',
   'Pastorale Schlusssitzung',
   'Session de clôture pastorale',
   NULL,
   'Hall Berlin, Messe Essen', NULL,
   NULL, v_sp_yombo),
  -- 21. Abendessen DBC (time TBC)  (internal)
  (v_event_id, 210, false, 'pending',
   (v_day_iso || ' 19:00:00')::timestamptz, NULL,
   'Abendessen DBC (time TBC)', 'Abendessen DBC (Zeit offen)', 'Dîner DBC (heure à confirmer)',
   'Team dinner — time to be confirmed by Ruth',
   'Team-Abendessen — Zeit von Ruth zu bestätigen',
   'Dîner d''équipe — heure à confirmer par Ruth',
   'Time TBC by Ruth — using 19:00 as placeholder.',
   NULL, NULL,
   v_team_ruth_mayala, NULL);

  -- 4. Re-attach any prior expense / checklist links by sort_order.
  UPDATE public.event_expenses e
    SET runsheet_item_id = r.id
  FROM public.event_runsheet_items r, _prior_links p
  WHERE r.event_id = v_event_id
    AND r.sort_order = p.sort_order
    AND e.id = p.expense_id;

  UPDATE public.event_checklist_items c
    SET runsheet_item_id = r.id
  FROM public.event_runsheet_items r, _prior_links p
  WHERE r.event_id = v_event_id
    AND r.sort_order = p.sort_order
    AND c.id = p.checklist_id;
END $$;

COMMIT;
