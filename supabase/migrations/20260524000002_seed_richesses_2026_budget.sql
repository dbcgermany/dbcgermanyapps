-- Seed the 22-line Richesses d'Afrique Germany 2026 budget from the
-- 2026-05-18 budget PDF. Total: 87,010.80 € across 4 categories.
--
-- Capital social UG (500 €) is deliberately excluded — it's equity, not an
-- expense (stays in the company per the PDF's own note).
--
-- All lines start with paid_at=NULL. Due dates reflect the PDF's
-- urgency tiers: URGENT 2026-05-01, IMMINENT 2026-05-18,
-- PROGRAMMÉ 2026-06-01.
--
-- Idempotent: skips lines that already exist (matches by description_fr).

DO $$
DECLARE
  v_event_id uuid := '702183da-aadb-4bae-a5af-6b13f01aaf21';  -- richesses-dafrique-germany-2026
BEGIN

  INSERT INTO public.event_expenses (
    event_id, category, description, description_en, description_de, description_fr,
    amount_cents, currency, vendor_name, due_date
  )
  SELECT v_event_id, x.category, x.description_fr, x.description_en, x.description_de, x.description_fr,
         conv.amount_cents, 'EUR', x.vendor_name, x.due_date
  FROM (VALUES
    -- CATEGORY 1 — Investissement stratégique
    ('other',      16930.00, 'DBC (interne)',           DATE '2026-05-01',
       'Platform development (Website · Ticketing · Admin app)',
       'Plattform-Entwicklung (Website · Ticketing · Admin-App)',
       'Développement plateformes (Site · Billetterie · App admin)'),
    ('other',       6720.00, 'DBC (interne)',           DATE '2026-05-01',
       'Maintenance & security — 12 months (559.72 €/month)',
       'Wartung & Sicherheit — 12 Monate (559,72 €/Monat)',
       'Maintenance & sécurité — 12 mois (559,72 €/mois)'),

    -- CATEGORY 2 — Base opérationnelle (excludes Capital social UG)
    ('other',       2500.00, NULL,                      DATE '2026-05-01',
       'UG company formation fees',
       'UG-Gründungskosten',
       'Frais de création UG'),
    ('other',       1300.00, 'Startplatz Düsseldorf',   DATE '2026-06-01',
       'Startplatz Düsseldorf — monthly rent (operations base)',
       'Startplatz Düsseldorf — Monatsmiete (operativer Sitz)',
       'Bureau Startplatz Düsseldorf — loyer mensuel'),
    ('other',          7.20, 'STRATO',                  DATE '2026-06-01',
       'STRATO domain — dbc-germany.com',
       'STRATO-Domain — dbc-germany.com',
       'Domaine STRATO — dbc-germany.com'),
    ('other',        303.60, 'Google Workspace',        DATE '2026-06-01',
       'Google Workspace — 12 months',
       'Google Workspace — 12 Monate',
       'Google Workspace — 12 mois'),

    -- CATEGORY 3 — Production événement
    ('venue',       5600.00, 'Messe Essen',             DATE '2026-05-01',
       'Messe Essen — venue rental',
       'Messe Essen — Saalmiete',
       'Location Messe Essen'),
    ('marketing',   2200.00, 'Micael',                  DATE '2026-05-01',
       'Marketing — Cameraman #1 (Micael)',
       'Marketing — Kameramann #1 (Micael)',
       'Marketing — Cameraman #1 (Micael)'),
    ('marketing',   2200.00, '247films.de',             DATE '2026-05-01',
       'Marketing — Cameraman #2 (247films)',
       'Marketing — Kameramann #2 (247films)',
       'Marketing — Cameraman #2 (247films)'),
    ('staffing',    1500.00, NULL,                      DATE '2026-05-01',
       'On-site security & driver',
       'Sicherheit & Fahrer vor Ort',
       'Sécurité & Chauffeur sur site'),
    ('marketing',   1000.00, NULL,                      DATE '2026-05-01',
       'Print & logistics (banners, signage, printed collateral)',
       'Druck & Logistik (Werbeplakate, Beschilderung, Drucksachen)',
       'Print & Logistique (Werbeplakate, signalétique)'),
    ('marketing',    750.00, NULL,                      DATE '2026-05-01',
       'Photographer',
       'Fotograf',
       'Photographe'),
    ('staffing',    1000.00, 'Nana Love',               DATE '2026-05-01',
       'Host — Nana Love',
       'Moderation — Nana Love',
       'Animateur — Nana Love'),
    ('staffing',    1500.00, NULL,                      DATE '2026-05-01',
       'Musicians — live act',
       'Musiker — Live-Act',
       'Musiciens — live act'),
    ('catering',    5000.00, 'Bonne Rue / Messe Essen', DATE '2026-06-01',
       'Catering — DBC delegation & VIPs (100 guests)',
       'Catering — DBC-Delegation & VIPs (100 Gäste)',
       'Catering Délégation + VIP (100 personnes)'),
    ('catering',    1000.00, NULL,                      DATE '2026-06-01',
       'Catering — public attendees (fingerfood)',
       'Catering — Besucher (Fingerfood)',
       'Catering visiteurs (Fingerfood)'),
    ('decoration',   500.00, NULL,                      DATE '2026-05-01',
       'Photo wall & roll-ups — shipped from Paris',
       'Fotowand & Roll-ups — Transport aus Paris',
       'Mur de photos & Roll-Ups (transport depuis Paris)'),

    -- CATEGORY 4 — Logistique HQ & Délégations
    ('logistics',   2000.00, NULL,                      DATE '2026-05-18',
       'Car for Dr Diambilay — chauffeured · 4 days',
       'Wagen für Dr. Diambilay — mit Fahrer · 4 Tage',
       'Voiture Dr Diambilay — chauffeur · 4 jours'),
    ('logistics',   8500.00, 'Breidenbacher Hof',       DATE '2026-05-18',
       'Hotel Dr Diambilay — Breidenbacher Hof · Grand Suite',
       'Hotel Dr. Diambilay — Breidenbacher Hof · Grand Suite',
       'Hôtel Dr Diambilay — Breidenbacher Hof · Grande Suite'),
    ('logistics',  12000.00, 'Booking.com / TBD',       DATE '2026-05-01',
       'Flights & hotel — DBC delegation + VIPs',
       'Flüge & Hotel — DBC-Delegation + VIPs',
       'Transport aérien & hôtel — Délégation DBC + VIP'),
    ('logistics',   8000.00, NULL,                      DATE '2026-05-01',
       'Transport & hotel — speakers (Fischer & Rubambura)',
       'Transport & Hotel — Speaker (Fischer & Rubambura)',
       'Transport & hôtel — Speakers (Fischer & Rubambura)'),
    ('logistics',   6500.00, NULL,                      DATE '2026-05-01',
       'Mercedes 16-seater bus — Brussels → Essen (12-15/06)',
       'Mercedes 16-Sitzer-Bus — Brüssel → Essen (12.-15.06.)',
       'Bus Mercedes 16 places — Brussels → Essen (12-15/06)')
  ) AS x(category, amount_eur, vendor_name, due_date, description_en, description_de, description_fr)
  CROSS JOIN LATERAL (
    SELECT (x.amount_eur * 100)::int AS amount_cents
  ) AS conv
  WHERE NOT EXISTS (
    SELECT 1 FROM public.event_expenses ee
    WHERE ee.event_id = v_event_id
      AND ee.description_fr = x.description_fr
  );

END $$;
