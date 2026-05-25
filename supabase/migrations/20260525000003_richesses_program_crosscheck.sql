-- =============================================================================
-- Richesses 2026 — Checklist + Budget cross-check.
--
-- Inserts prep checklist items that the 2026-05-02 day-of PDF revealed but
-- weren't in the existing checklist (Rolls Royce booking, Rudy briefing,
-- Pasteur Yombo slot, hostess crew, photo wall + badges, 247films & Micaël
-- arrival times). Each new item points at the runsheet row it serves via
-- the new event_checklist_items.runsheet_item_id FK.
--
-- Links existing event_expenses rows to the runsheet rows they pay for so
-- the budget page can show "→ Setup" / "→ VIP arrival" etc.
--
-- Per feedback_no_paid_addons: we don't INSERT speculative new spend lines.
-- Budget gaps the PDF reveals (Rolls Royce rental, hostess crew) get
-- RAISE NOTICE for Ruth/Jay to decide; nothing is added without sign-off.
--
-- Idempotent: checklist INSERTs are skipped if a row with the same
-- (event_id, title) already exists.
--
-- Date: 2026-05-25
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_event_id uuid := '702183da-aadb-4bae-a5af-6b13f01aaf21';

  -- Runsheet row IDs resolved by sort_order (stable per the seed migration)
  v_row_setup         uuid; -- sort 10
  v_row_hall_access   uuid; -- sort 20
  v_row_registration  uuid; -- sort 40
  v_row_live_music    uuid; -- sort 50
  v_row_vip_arrival   uuid; -- sort 70
  v_row_media_time    uuid; -- sort 80
  v_row_opening       uuid; -- sort 100
  v_row_networking1   uuid; -- sort 130
  v_row_networking2   uuid; -- sort 160
  v_row_pasteur       uuid; -- sort 200
BEGIN
  SELECT id INTO v_row_setup        FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 10;
  SELECT id INTO v_row_hall_access  FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 20;
  SELECT id INTO v_row_registration FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 40;
  SELECT id INTO v_row_live_music   FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 50;
  SELECT id INTO v_row_vip_arrival  FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 70;
  SELECT id INTO v_row_media_time   FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 80;
  SELECT id INTO v_row_opening      FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 100;
  SELECT id INTO v_row_networking1  FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 130;
  SELECT id INTO v_row_networking2  FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 160;
  SELECT id INTO v_row_pasteur      FROM public.event_runsheet_items WHERE event_id = v_event_id AND sort_order = 200;

  -- ------------------------------------------------------------------
  -- 1. Insert prep checklist items revealed by the day-of PDF.
  -- ------------------------------------------------------------------
  INSERT INTO public.event_checklist_items
    (event_id, title, category, description, status, sort_order, runsheet_item_id)
  SELECT v_event_id, x.title, x.category, x.description, 'pending', x.sort_order, x.runsheet_item_id
  FROM (VALUES
    ('Book Rolls Royce arrival car for Dr. J-C',           'logistics',
     'PDF row 7 calls for a Rolls Royce VIP arrival (eBay Kleinanzeigen). Confirm rental + driver + insurance.',
     200, v_row_vip_arrival),
    ('Brief Moderateur Rudy for the Opening',              'production',
     'PDF row 10 — Rudy hosts the official opening. Run-through 60 min before doors, mic check, cue sheet.',
     210, v_row_opening),
    ('Confirm Pasteur Matthieu Yombo — closing blessing',  'logistics',
     'PDF row 20 — 90-min slot in Hall Berlin (16:30–18:00). Confirm attendance + theme + tech needs.',
     220, v_row_pasteur),
    ('Confirm hostess crew (2 scan, 1 VIP, 2 Premium)',    'staffing',
     'PDF row 4 — 5 hostesses needed: 2 for QR check-in (Business/Premium/Standard), 1 dedicated VIP, 2 Premium.',
     230, v_row_registration),
    ('Order photo wall + badges (DBC Belgique/France)',    'production',
     'PDF row 8 — ''Fotowand bestellen: DBC Belgique/France fragen + Badges''. Confirm Paris shipment + arrival deadline.',
     240, v_row_media_time),
    ('Confirm Alex (247films) arrival 06:30',              'production',
     'PDF row 1 — second cameraman, on site at 06:30 for setup phase.',
     250, v_row_setup),
    ('Confirm Micaël N. arrival 06:30',                    'production',
     'PDF row 1 — first cameraman, on site at 06:30 for setup phase.',
     260, v_row_setup)
  ) AS x(title, category, description, sort_order, runsheet_item_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.event_checklist_items c
    WHERE c.event_id = v_event_id AND c.title = x.title
  );

  -- ------------------------------------------------------------------
  -- 2. Link existing event_expenses rows to the runsheet rows they pay for.
  -- Matches by description text (the budget rows have stable French
  -- descriptions per migration 20260524000002). Only sets runsheet_item_id
  -- when currently NULL so re-running doesn't trample any manual links.
  -- ------------------------------------------------------------------
  UPDATE public.event_expenses SET runsheet_item_id = v_row_networking2
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Catering Délégation + VIP (100 personnes)';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_networking1
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Catering visiteurs (Fingerfood)';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_setup
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Marketing — Cameraman #1 (Micael)';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_setup
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Marketing — Cameraman #2 (247films)';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_media_time
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Mur de photos & Roll-Ups (transport depuis Paris)';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_live_music
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Musiciens — live act';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_vip_arrival
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Photographe';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_hall_access
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Sécurité & Chauffeur sur site';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_vip_arrival
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Voiture Dr Diambilay — chauffeur · 4 jours';
  UPDATE public.event_expenses SET runsheet_item_id = v_row_networking1
    WHERE event_id = v_event_id AND runsheet_item_id IS NULL
      AND description = 'Animateur — Nana Love';

  -- ------------------------------------------------------------------
  -- 3. Budget gap report (advisory only — per feedback_no_paid_addons,
  -- we don't auto-insert speculative spend). Each NOTICE surfaces a
  -- PDF-revealed expense that's missing from event_expenses.
  -- ------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM public.event_expenses
    WHERE event_id = v_event_id
      AND (description ILIKE '%Rolls Royce%' OR description ILIKE '%Mietwagen%')
  ) THEN
    RAISE NOTICE 'Budget gap: Rolls Royce arrival car (PDF row 7) not in event_expenses — Ruth/Jay to decide whether to add a spend line.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.event_expenses
    WHERE event_id = v_event_id
      AND (description ILIKE '%hostess%' OR description ILIKE '%Hôtesse%' OR description ILIKE '%Hostessen%')
  ) THEN
    RAISE NOTICE 'Budget gap: Hostess crew (PDF row 4 — 5 hostesses) not in event_expenses — Ruth/Jay to decide whether to add a spend line.';
  END IF;
END $$;

COMMIT;
