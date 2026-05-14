-- =============================================================================
-- 20260515000002  seed_richesses_2026_media_contacts
-- =============================================================================
-- Inserts the 70 media contacts researched for Richesses d'Afrique Germany
-- 2026 (local Essen press, German diaspora media, pan-African + Belgian + DRC
-- press, Tier 3 influencers / podcasters / diaspora orgs). Tags each with the
-- existing `press` contact category and creates a `press` involvement on the
-- Richesses 2026 event.
--
-- Pre-step: rewrites the synthesized Veye Tatah email from the sponsor seed
-- so the new media row merges into the same contact instead of creating a
-- duplicate.
--
-- Idempotent — ON CONFLICT (email) DO UPDATE keeps the row aligned with the
-- canonical source (this file). Safe to re-run.
-- Source: cred/media-contacts-pdf-2026-05.pdf (70 rows).
-- =============================================================================

-- ----- pre-step: fix synthesized Africa Positive email from sponsor seed ----
UPDATE public.contacts
   SET email = 'info@africa-positive.de'
 WHERE email = 'unverified+africa-positive@dbc-germany.local'
   AND NOT EXISTS (
     SELECT 1 FROM public.contacts WHERE email = 'info@africa-positive.de'
   );

DO $seed$
DECLARE
  v_event uuid;
  v_press uuid;
  v_contact_id uuid;
  v_row record;
BEGIN
  SELECT id INTO v_event
    FROM public.events
   WHERE slug = 'richesses-dafrique-germany-2026';

  SELECT id INTO v_press
    FROM public.contact_categories
   WHERE slug = 'press';

  IF v_press IS NULL THEN
    RAISE EXCEPTION 'press category not found — aborting media seed';
  END IF;

  IF v_event IS NULL THEN
    RAISE NOTICE 'Event richesses-dafrique-germany-2026 not found — press involvements will be skipped';
  END IF;

  FOR v_row IN
    SELECT *
      FROM (VALUES
        -- email | first_name | last_name | organization | occupation
        -- phone | website_url | linkedin_url | country | hq_country
        -- tier | sector | pitch_tier | best_contact_method | confidence
        -- email_verified | admin_notes

        -- ========== Tier 1 — Essen-local press (12 rows) ==========
        ('redaktion.essen@waz.de', 'Andreas', 'Tyrock',
         'WAZ — Westdeutsche Allgemeine Zeitung (Lokalredaktion Essen)',
         'Chefredakteur (Auflage 275.590)',
         '+49 201 804 8193', 'https://www.waz.de', NULL, 'DE', 'DE',
         'Tier 1', 'Tageszeitung', 'Earned', 'email', 85, false,
         'Hook: Größte NRW-Lokalzeitung mit HQ in Essen; Event bei Messe Essen = Pflichttermin für Lokalredaktion. Best contact: Email + Pressemitteilung 2 Wochen vorab. Secondary inbox: zentralredaktion@waz.de. Source: Media Contacts PDF (2026-05).'),

        ('lok.essen@nrz.de', 'Team', 'Lokalredaktion Essen',
         'NRZ — Neue Ruhr Zeitung (Lokalredaktion Essen)', 'Lokalredaktion',
         '+49 201 804 2647', 'https://www.nrz.de', NULL, 'DE', 'DE',
         'Tier 1', 'Tageszeitung', 'Earned', 'email', 85, false,
         'Hook: Funke-Schwestertitel der WAZ, andere Leserschaft, ergänzt Reichweite in Essen-Nord/Innenstadt. Best contact: Email Lokalredaktion. Secondary inbox: redaktion@nrz.de. Source: Media Contacts PDF (2026-05).'),

        ('redaktion-stadtspiegel-essen@funkemedien.de', 'Sara Holz /', 'Christa Herlinger',
         'Stadtspiegel Essen-Netzwerk', 'Redakteurinnen (Auflage zusammen ~222.000)',
         '+49 201 804 2068', 'https://www.lokalkompass.de', NULL, 'DE', 'DE',
         'Tier 1', 'Wochenblatt', 'Earned + Paid', 'email', 85, false,
         'Hook: Sieben kostenlose Anzeigenblätter erreichen JEDEN Essener Haushalt — die wichtigste Hyperlokal-Plattform. Best contact: Email + Foto-Beilage (Eyecatcher wirkt im Anzeigenblatt). Secondary inbox: redaktion@borbeckkurier-essen.de. Source: Media Contacts PDF (2026-05).'),

        ('anzeigen@stadtspiegel-essen.de', 'Britta', 'Sippel',
         'Funke Media Sales NRW GmbH (Vermarktung Anzeigen Stadtspiegel/WAZ/NRZ)',
         'Vermarktungsleiterin Stadtspiegel Essen',
         '+49 201 8042060', 'https://www.funkemediasalesnrw.de', NULL, 'DE', 'DE',
         'Tier 1', 'Anzeigenblatt — Sales', 'Paid', 'phone', 85, false,
         'Hook: Ansprechpartner für bezahlte Doppelseite oder Advertorial im Anzeigenblatt + WAZ-Print/Online-Kombi. Best contact: Direktanruf für Anzeigenpaket DBC. Secondary inbox: vermarktung@funkemedien.de. Source: Media Contacts PDF (2026-05).'),

        ('info@radioessen.de', 'Team', 'Studio Lindenallee',
         'Radio Essen 102,2 (NRW-Bürgerradio Essen)', 'Redaktion / Programmleitung',
         '+49 201 24585 0', 'https://www.radioessen.de', NULL, 'DE', 'DE',
         'Tier 1', 'Radio', 'Earned', 'phone', 85, false,
         'Hook: Einziger Stadtsender, Pflichttermin für Lifestyle/Kultur-Events in Essen — sehr lokal-affin. Best contact: Anruf Redaktion 10 Tage vorab + Pressemitteilung. Source: Media Contacts PDF (2026-05).'),

        ('studio.essen@wdr.de', 'Team', 'Redaktion Studio Essen',
         'WDR Studio Essen — Lokalzeit Ruhr (Hörfunk + Fernsehen)', 'Lokalredaktion Ruhr',
         '+49 201 81080 0', 'https://www1.wdr.de', NULL, 'DE', 'DE',
         'Tier 1', 'TV / Public Broadcaster', 'Earned', 'email', 60, false,
         'Hook: Lokalzeit Ruhr — wichtigstes regionales TV-Fenster; Multikulti-Themen werden hier prominent gespielt. Best contact: Pressemitteilung 3 Wochen vorab + persönlicher Anruf bei Redakteur. Source: Media Contacts PDF (2026-05).'),

        ('redaktion@esseninside.de', 'Team', 'Digitalverlag Westfalen-Ruhr',
         'DigitalZeitung.Ruhr — ESSEN Inside', 'Redaktion',
         '+49 201 42 63 99 57 0', 'https://www.esseninside.de', NULL, 'DE', 'DE',
         'Tier 1', 'Online Lokal', 'Earned + Paid', 'email', 60, false,
         'Hook: Digital-erste Plattform für Essener Lifestyle/Kultur, sehr offen für sponsored Stories. Best contact: Email mit hochauflösendem Foto. Source: Media Contacts PDF (2026-05).'),

        ('redaktion@rtl-west.de', 'Team', 'Redaktion RTL-WEST',
         'RTL-WEST (NRW-Regionalfenster)', 'Redaktion',
         '+49 201 74750', 'https://www.rtl-west.de', NULL, 'DE', 'DE',
         'Tier 1', 'TV / Regional', 'Earned', 'email', 60, false,
         'Hook: RTL-WEST sendet werktäglich aus Essen — größte NRW-Privat-TV-Reichweite, Sitz nur 2km vom Messegelände. Best contact: Pressemitteilung + persönliche Beziehung. Source: Media Contacts PDF (2026-05).'),

        ('essen@dpa.com', 'Team', 'Essener Korrespondent',
         'dpa Deutsche Presse-Agentur (Bureau Essen)', 'Korrespondenz Ruhrgebiet',
         '+49 201 18927 0', 'https://www.dpa.com', NULL, 'DE', 'DE',
         'Tier 1', 'Nachrichtenagentur', 'Earned (Multiplier)', 'email', 60, false,
         'Hook: Eine dpa-Meldung wird von Hunderten Redaktionen übernommen — extrem hohe Multiplikatorwirkung. Best contact: Pressemitteilung mit klarer Nachrichtenfunktion. Source: Media Contacts PDF (2026-05).'),

        ('redaktion@werdener-nachrichten.de', 'Team', 'Lokalredaktion Werden',
         'Werdener Nachrichten', 'Lokalredaktion',
         '+49 201 8494 19', 'https://www.werdener-nachrichten.de', NULL, 'DE', 'DE',
         'Tier 1', 'Lokalzeitung Print', 'Earned', 'email', 60, false,
         'Hook: Älteste Stadtteilzeitung Essens; Werden ist nahe der Messe Essen. Best contact: Email + persönlicher Termin. Source: Media Contacts PDF (2026-05).'),

        ('v.umbreit@fzs-verlag.de', 'V.', 'Umbreit',
         'Früh zum Sonntag (Kupferdreh / Burgaltendorf / Heisingen / Überruhr)', 'Redaktion',
         '+49 201 4585 8091', 'https://www.fzs-verlag.de', NULL, 'DE', 'DE',
         'Tier 1', 'Lokalzeitung Print', 'Earned', 'email', 30, true,
         'Hook: Süd-Essen, gute Reichweite in finanzkräftigen Stadtteilen. Best contact: Email. Source: Media Contacts PDF (2026-05).'),

        ('kontakt@ruhrpott-aktuell.de', 'Team', 'Ruhrpott aktuell Redaktion',
         'Glück auf Nachbarschaft (Katernberg/Schonnebeck/Stoppenberg)', 'Redaktion',
         '+49 201 835 4419', NULL, NULL, 'DE', 'DE',
         'Tier 1', 'Lokalzeitung Print', 'Earned', 'email', 30, false,
         'Hook: Nord-Essen, hohe Diaspora-Communities-Dichte. Best contact: Email. Source: Media Contacts PDF (2026-05).'),

        -- ========== Tier 1 — Essen lifestyle + diaspora (11 rows) ==========
        ('hallo@offguide.de', 'Team', 'Redaktion Offguide',
         'Offguide — Lifestyle Essen', 'Chefredaktion',
         '+49 201 749240 18', 'https://www.offguide.de', NULL, 'DE', 'DE',
         'Tier 1', 'Lifestyle Online', 'Earned + Paid', 'email', 85, false,
         'Hook: Premium-Lifestyle-Plattform für Essen-Rüttenscheid — passt perfekt zum Event-Tone. Best contact: Email mit Visuals + Eventeinladung. Source: Media Contacts PDF (2026-05).'),

        ('info@africa-positive.de', 'Veye', 'Tatah',
         'AFRICA POSITIVE Magazin (NRW-basiert)',
         'Gründerin & Chefredakteurin (Bundesverdienstkreuz)',
         '+49 231 79 78 590', 'https://www.africa-positive.de', NULL, 'DE', 'DE',
         'Tier 1', 'Diaspora-Magazin', 'Earned + Cross-Promo', 'phone', 85, false,
         'Hook: Wichtigstes positives Afrika-Magazin Deutschlands, Sitz in Dortmund (40min von Essen) — Ausgabe 100 erschien 2026. Best contact: Anruf — direkte persönliche Beziehung möglich. Source: Media Contacts PDF (2026-05).'),

        ('redaktion@lonam.de', 'Hervé', 'Tcheumeleu',
         'LoNam — Das Afrika-Magazin',
         'Geschäftsführer / Chefredakteur (Kamerunisch-deutsch)',
         '+49 30 552 083 33', 'https://www.lonam.de', NULL, 'DE', 'DE',
         'Tier 1', 'Diaspora-Magazin', 'Earned + Paid', 'email', 85, false,
         'Hook: Auflagenstarkes deutschsprachiges Afrika-Magazin (DE/AT/CH), Diaspora-Mainstream — Pflichtkontakt. Best contact: Email + Anruf — Magazin erscheint bimonatlich, Vorlauf 6 Wochen. Secondary inbox: info@lonam.de. Source: Media Contacts PDF (2026-05).'),

        ('info@afronews.de', 'Stephen', 'Ogongo',
         'Afronews Germany (afronews.de)', 'CEO & Editor-in-Chief',
         '+39 333 301 0654', 'https://www.afronews.de', NULL, 'IT', 'IT',
         'Tier 1', 'Diaspora-Online', 'Earned + Sponsorship', 'whatsapp', 85, false,
         'Hook: 48K+ Facebook-Fans, hostet jährlich die AFRONEWS Awards Germany; ihr Stream + ihre Plattform = direkte Diaspora-Reichweite. Best contact: WhatsApp direkt — Ogongo ist hochresponsiv. Source: Media Contacts PDF (2026-05).'),

        ('info@theafricancourier.de', 'Femi', 'Awoniyi',
         'The African Courier (Berlin / international)', 'Publisher & Editor-in-Chief',
         '+49 30 23 00 74 40', 'https://www.theafricancourier.de', NULL, 'DE', 'DE',
         'Tier 1', 'Diaspora-Magazin', 'Earned', 'email', 85, false,
         'Hook: Seit 1998, vertrieben in Kamerun, Gambia, Ghana, Kenya, Nigeria, RSA, Westeuropa — extremes pan-afrikanisches Reichweitenfeld. Best contact: Email Press Kit + Interview-Pitch. Source: Media Contacts PDF (2026-05).'),

        ('unverified+african-magazin@dbc-germany.local', 'Team', 'AFRICAN-Mag Redaktion',
         'AFRICAN Magazin', 'Verlag / Chefredaktion',
         NULL, 'https://african-mag.company.site', NULL, 'DE', 'DE',
         'Tier 1', 'Diaspora-Magazin Print', 'Earned', 'web_form', 60, false,
         'Hook: Print-Magazin halbjährlich, 164 Seiten, Afrika-Liebhaber-Zielgruppe — gut für ausführliche Reportagen. Best contact: Website-Formular + Email-Followup. No public email — placeholder used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+afrotak@dbc-germany.local', 'Team', 'AFROTAK Redaktion',
         'AFROTAK TV cyberNomads (Schwarze Deutsche Medien-Archiv)',
         'Pan-Afrika TV/Online-Archiv',
         NULL, 'https://afrotak.wordpress.com', NULL, 'DE', 'DE',
         'Tier 1', 'Diaspora-Online', 'Earned', 'email', 30, false,
         'Hook: Historisch wichtig — Archiv für Schwarze Deutsche Bildung/Kultur/Medien. Best contact: Email + Web-Form (afrotak.wordpress.com). Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+pan-african-daily-tv@dbc-germany.local', 'Susan', 'Tatah',
         'Pan African Daily TV',
         'Founder / CEO Pan African Daily TV; Founder Afrika Festival Tübingen',
         NULL, 'https://www.panafricandailytv.org', NULL, 'DE', 'DE',
         'Tier 1', 'Pan-Afrika TV', 'Earned + Cross-Promo', 'linkedin', 60, false,
         'Hook: Internationale Reichweite, Verbindungen zu allen großen Diaspora-Festivals — potenzielle Medien-Partnerin. Best contact: LinkedIn + Email (zweisprachig EN/DE). Dr. title. Secondary URL: afroworld.tv. Tübingen-based. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('cosmo@wdr.de', 'Team', 'COSMO Hörfunk-Redaktion',
         'WDR COSMO (Köln — interkulturelles Radio, ex-Funkhaus Europa)',
         'Hörfunk-Redaktion / Moderatoren',
         '+49 221 220 0', 'https://www1.wdr.de/radio/cosmo', NULL, 'DE', 'DE',
         'Tier 1', 'Diaspora-Radio (ARD)', 'Earned', 'email', 85, false,
         'Hook: EINZIGES öffentlich-rechtliches Multikulti-Radio mit Afrika-Affinität; sendet aus Köln (NRW), ~45min Essen. Sound der Welt. Best contact: Email mit Story-Angle (Diaspora + Wirtschaft) — Vorlauf 2-3 Wochen. Source: Media Contacts PDF (2026-05).'),

        ('unverified+africa-live@dbc-germany.local', 'Team', 'Africa Live Online-Redaktion',
         'Africa live Magazin', 'Online-Redaktion',
         NULL, 'https://www.africa-live.de', NULL, 'DE', 'DE',
         'Tier 1', 'Online Magazin', 'Earned', 'web_form', 60, false,
         'Hook: Afrika-Online-Magazin auf Deutsch — Politik/Wirtschaft/Kultur/Reise. Best contact: Web-Form. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('info@bpb.de', 'Team', 'Redaktion Afrikanische Diaspora',
         'Bundeszentrale für politische Bildung (bpb) — Afrikanische Diaspora in DE',
         'Themenredaktion',
         '+49 228 99515 0', 'https://www.bpb.de', NULL, 'DE', 'DE',
         'Tier 1', 'Bildung / Multiplikator', 'Earned', 'email', 60, false,
         'Hook: bpb.de ist Multiplikator für Bildungsmaterial — Erwähnung als Event bei wichtigen Diaspora-Events bringt Long-tail-Suche. Best contact: Pressemitteilung + Fachjournalisten-Email. Source: Media Contacts PDF (2026-05).'),

        -- ========== Tier 2 — German wider press (10 rows) ==========
        ('redaktionssekretariat@rheinische-post.de', 'Moritz', 'Döbler',
         'Rheinische Post / RP Online (Düsseldorf)', 'Chefredakteur (Auflage 249.879)',
         '+49 211 50 50', 'https://rp-online.de', NULL, 'DE', 'DE',
         'Tier 2', 'Tageszeitung', 'Earned', 'email', 60, false,
         'Hook: Größte NRW-Zeitung außerhalb Funke; deckt das gesamte Rheinland — Vize-CR Stefan Weigel + Horst Thoren. Best contact: Pressemitteilung an Sekretariat + Lokal Düsseldorf. Source: Media Contacts PDF (2026-05).'),

        ('lokalredaktion.dortmund@ruhrnachrichten.de', 'Wolfram', 'Kiwit',
         'Ruhr Nachrichten (Lensing Media Dortmund)', 'Chefredakteur',
         '+49 231 9059 4555', 'https://www.ruhrnachrichten.de', NULL, 'DE', 'DE',
         'Tier 2', 'Tageszeitung', 'Earned', 'email', 60, false,
         'Hook: Auflage 109.149 — wichtigste Ruhrgebiet-Tageszeitung jenseits Funke; deckt Dortmund (30km von Essen). Co-Chefredakteur: Jens Ostrowski. Best contact: Email + Pitch-Followup. Secondary inbox: dortmund@lensingmedia.de. Source: Media Contacts PDF (2026-05).'),

        ('redaktion.duisburg@waz.de', 'Team', 'WAZ Lokalredaktionen Ruhrgebiet',
         'WAZ Lokalredaktionen Duisburg + Bochum + Gelsenkirchen', 'Lokalredaktion',
         NULL, 'https://www.waz.de', NULL, 'DE', 'DE',
         'Tier 2', 'Tageszeitung', 'Earned', 'email', 60, false,
         'Hook: Diaspora-Communities sind über alle Ruhrgebietsstädte verteilt — Cross-Promo mit WAZ-Schwestern lohnt sich. Best contact: Email Nachbar-Lokalredaktionen (Bochum +49 234, Duisburg +49 203, GE +49 209). Secondary inboxes: redaktion.bochum@waz.de, redaktion.gelsenkirchen@waz.de. Source: Media Contacts PDF (2026-05).'),

        ('derwesten@derwesten.de', 'Team', 'DER WESTEN Online-Chefredaktion',
         'DER WESTEN (Funke Digital)', 'Online-Chefredaktion',
         '+49 800 6060 760', 'https://www.derwesten.de', NULL, 'DE', 'DE',
         'Tier 2', 'Anzeigenblatt', 'Earned', 'email', 60, false,
         'Hook: Digital-Plattform der Funke-Mediengruppe — clickbait-affin, gute Reichweite, integriert mit WAZ/NRZ. Best contact: Email mit klickstarkem Angle. Source: Media Contacts PDF (2026-05).'),

        ('info@rvr.ruhr', 'Team', 'RVR Pressestelle',
         'Informationsdienst Ruhr (Regionalverband Ruhr)',
         'Pressestelle Regionalverband Ruhr',
         '+49 201 2069 281', 'https://www.rvr.ruhr', NULL, 'DE', 'DE',
         'Tier 2', 'Magazin', 'Earned', 'email', 60, false,
         'Hook: Regionalverband Ruhr deckt 53 Städte — Aufnahme in deren Newsletter ein Multiplier. Best contact: Pressemitteilung. Source: Media Contacts PDF (2026-05).'),

        ('info@lokalklick.eu', 'Team', 'LokalKlick Online-Redaktion',
         'LokalKlick Rhein-Ruhr', 'Online-Redaktion',
         '+49 2841 8858776', 'https://www.lokalklick.eu', NULL, 'DE', 'DE',
         'Tier 2', 'Online', 'Earned', 'email', 30, false,
         'Hook: Niederrhein-Ruhr Online-Lokalmedium. Best contact: Email. Source: Media Contacts PDF (2026-05).'),

        ('redaktion@mein-kurier.ruhr', 'Team', 'Mein Kurier Redaktion',
         'Mein Kurier', 'Redaktion',
         '+49 177 7059805', 'https://www.mein-kurier.ruhr', NULL, 'DE', 'DE',
         'Tier 2', 'Online', 'Earned', 'email', 30, false,
         'Hook: Hyperlokales Online-Magazin Essen. Best contact: Email. Source: Media Contacts PDF (2026-05).'),

        ('kundenservice@handelsblatt.com', 'Sebastian', 'Matthes',
         'Handelsblatt (Düsseldorf)', 'Chefredakteur',
         '+49 211 887 0', 'https://www.handelsblatt.com', NULL, 'DE', 'DE',
         'Tier 2', 'Wirtschaftspresse', 'Earned', 'email', 30, false,
         'Hook: Größte Wirtschafts-Tageszeitung Deutschlands, Sitz Düsseldorf (30km Essen) — Africa-Business-Themen werden ressortübergreifend bedient. Best contact: Pressemitteilung an Wirtschaftsredaktion + Auslandsressort. Secondary inbox: handelsblatt@vhb.de. Source: Media Contacts PDF (2026-05).'),

        ('kundenservice@wiwo.de', 'Horst', 'von Buttlar',
         'WirtschaftsWoche (Düsseldorf)', 'Chefredakteur',
         '+49 211 887 3602', 'https://www.wiwo.de', NULL, 'DE', 'DE',
         'Tier 2', 'Wirtschaftsmagazin', 'Earned', 'email', 30, false,
         'Hook: WiWo wendet sich an deutsche Manager — DBC-Story als Deutsch-Afrikanisches Wirtschaftsforum framen. Best contact: Pressemitteilung + persönlicher Pitch. Source: Media Contacts PDF (2026-05).'),

        ('info@iqm.de', 'Team', 'Anzeigen B2B',
         'iq media marketing (HB / WiWo Anzeigen)', 'Anzeigenverkauf',
         '+49 211 887 1302', 'https://www.iqm.de', NULL, 'DE', 'DE',
         'Tier 2', 'Werbung B2B', 'Paid', 'phone', 30, false,
         'Hook: Anzeigen-Vermarkter für Handelsblatt + WiWo — kostspielig aber B2B-Premium-Reichweite. Best contact: Direktanruf für Anzeigenpaket. Source: Media Contacts PDF (2026-05).'),

        -- ========== Tier 2 — Pan-African / European / DRC press (15 rows) ==========
        ('unverified+african-business@dbc-germany.local', 'David', 'Thomas',
         'African Business Magazine (London)', 'Editor',
         NULL, 'https://african.business', NULL, 'GB', 'GB',
         'Tier 2', 'Pan-Afrika Magazin EN', 'Earned', 'email', 60, false,
         'Hook: Seit 1982, 140K+ Abonnenten weltweit, EN+FR Auflage — DAS pan-afrikanische Business-Magazin. Best contact: Email an Editor + Pressemitteilung + Sponsor-Story. Placeholder email used (no public direct address). Source: Media Contacts PDF (2026-05).'),

        ('editorial@theafricareport.com', 'Nicholas', 'Norbrook',
         'The Africa Report (Jeune Afrique Group, Paris)', 'Managing Editor',
         NULL, 'https://www.theafricareport.com', NULL, 'FR', 'FR',
         'Tier 2', 'Pan-Afrika Magazin EN', 'Earned + Paid', 'email', 60, false,
         'Hook: Englischsprachiges Schwester-Magazin von Jeune Afrique, vierteljährlich, 1Mio+ Leser; sehr Decision-Maker-orientiert. Best contact: Email Editorial + Sales (für Sponsored Content). Secondary inbox: advertising@theafricareport.com. Source: Media Contacts PDF (2026-05).'),

        ('unverified+jeune-afrique@dbc-germany.local', 'Team', 'Rédaction Afrique / RDC Desk',
         'Jeune Afrique (Paris)', 'Rédaction',
         NULL, 'https://www.jeuneafrique.com', NULL, 'FR', 'FR',
         'Tier 2', 'Pan-Afrika Magazin FR', 'Earned', 'email', 60, false,
         'Hook: Wichtigstes francophones Afrika-Magazin; eigene RDC-Vertikale. Pflicht für DRC-Sichtbarkeit. Best contact: Email + Followup über Tshipama-Netzwerk. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+africanews@dbc-germany.local', 'Team', 'Africanews Newsdesk',
         'Africanews (Lyon)', 'Newsdesk EN/FR/PT',
         NULL, 'https://www.africanews.com', NULL, 'FR', 'FR',
         'Tier 2', 'Pan-Afrika TV/Online', 'Earned', 'email', 60, false,
         'Hook: Pan-afrikanische multilinguale 24/7-News, Schwester von Euronews — extrem reichweitenstark. Best contact: Email mit Pressemitteilung in EN+FR. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+forbes-africa@dbc-germany.local', 'Team', 'Forbes Africa Editorial',
         'Forbes Africa', 'Editorial',
         NULL, 'https://www.forbesafrica.com', NULL, 'ZA', 'ZA',
         'Tier 2', 'Pan-Afrika Online', 'Earned', 'email', 30, false,
         'Hook: Forbes Brand, 233K FB / 191K IG Follower — exklusivierende Wirtschaftsstory anbieten. Best contact: Email Editorial. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+le-monde-afrique@dbc-germany.local', 'Team', 'Rédaction Le Monde Afrique',
         'Le Monde Afrique (Paris)', 'Rédaction Afrique',
         '+33 1 57 28 20 00', 'https://www.lemonde.fr/afrique', NULL, 'FR', 'FR',
         'Tier 2', 'Pan-Afrika Magazin FR', 'Earned', 'email', 30, false,
         'Hook: Le Monde hat eigene Afrique-Vertikale — schwer zu erreichen, aber prestigeträchtig. Best contact: Email Pressemitteilung in FR. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+lesoir-afrique@dbc-germany.local', 'Colette', 'Braeckman',
         'Le Soir Belgique — Africa Desk', 'Journaliste-Spécialiste RDC/Congo',
         '+32 2 225 54 32', 'https://www.lesoir.be', NULL, 'BE', 'BE',
         'Tier 2', 'Belgian Press', 'Earned', 'email', 60, false,
         'Hook: Braeckman ist DIE Congo-Spezialistin der frankophonen Presse — endgültige Diaspora-Glaubwürdigkeit. Best contact: Email Pressemitteilung FR + persönlicher Interview-Pitch. Placeholder email used (lesoir.be redaction routing). Source: Media Contacts PDF (2026-05).'),

        ('unverified+lalibre-afrique@dbc-germany.local', 'Team', 'Rédaction Afrique La Libre',
         'La Libre Afrique (La Libre Belgique)', 'Rédaction Afrique',
         '+32 2 211 28 11', 'https://afrique.lalibre.be', NULL, 'BE', 'BE',
         'Tier 2', 'Belgian Press Africa', 'Earned', 'email', 60, false,
         'Hook: Wichtige Belgische Afrika-Vertikale, sehr DRC-fokussiert. Best contact: Email FR. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+rtbf-afrique@dbc-germany.local', 'Team', 'RTBF Service Afrique',
         'RTBF — Radio-Télévision Belge (Service Afrique)', 'Service Afrique',
         '+32 2 737 21 11', 'https://www.rtbf.be/info/monde/afrique', NULL, 'BE', 'BE',
         'Tier 2', 'Belgian TV/Radio Public', 'Earned', 'email', 60, false,
         'Hook: Öffentlich-rechtliches Radio/TV Belgiens; massive Diaspora-Reichweite, partnert mit TV5 Monde. Best contact: Email FR Pitch. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+tv5monde@dbc-germany.local', 'Team', 'TV5 Monde Newsdesk Afrique',
         'TV5 Monde (Service International)', 'Newsdesk Afrique',
         '+33 1 44 18 55 55', 'https://www.tv5monde.com', NULL, 'FR', 'FR',
         'Tier 2', 'International TV FR', 'Earned', 'email', 30, false,
         'Hook: Frankophone Welt-TV — TiVi5 Monde Africa seit 2016, gigantisches Diaspora-Publikum. Best contact: Email + Press Kit. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+topcongo@dbc-germany.local', 'Christian', 'Lusakueno',
         'Top Congo FM (Kinshasa, Reichweite Belgien)', 'Fondateur & Journaliste',
         NULL, 'https://www.topcongo.fm', NULL, 'CD', 'CD',
         'Tier 2', 'RDC Radio', 'Earned', 'email', 60, false,
         'Hook: Privater Marktführer in RDC laut Kantar TNS; hat Belgien-Studio bei Wahlen — extrem relevant für Diaspora. Best contact: Email FR + persönlicher Anruf — wegen DRC-Diaspora-Bezug. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+actualite-cd@dbc-germany.local', 'Team', 'Rédaction actualite.cd',
         'actualite.cd (Groupe Next Corp Kinshasa)', 'Rédaction',
         NULL, 'https://actualite.cd', NULL, 'CD', 'CD',
         'Tier 2', 'RDC Online', 'Earned', 'email', 60, false,
         'Hook: Seit 2016, Schwerpunkt Politik/Sicherheit/Wirtschaft — eine der seriösesten RDC-Quellen. Best contact: Email FR mit fokussierter Politik/Wirtschaft-Story. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+mediacongo@dbc-germany.local', 'Team', 'Rédaction Mediacongo',
         'Mediacongo.net', 'Rédaction',
         NULL, 'https://www.mediacongo.net', NULL, 'CD', 'CD',
         'Tier 2', 'RDC Online', 'Earned', 'email', 60, false,
         'Hook: Großes RDC-Portal mit eigener Diaspora-Sektion — perfekt für die Ankündigung. Best contact: Email FR + Diaspora-Sektion-Pitch. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+7sur7-cd@dbc-germany.local', 'Team', 'Rédaction 7sur7 Générale',
         '7sur7.cd', 'Rédaction Générale',
         NULL, 'https://7sur7.cd', 'https://www.instagram.com/7sur7.cd', 'CD', 'CD',
         'Tier 2', 'RDC Online', 'Earned', 'instagram', 60, false,
         'Hook: Größte RDC-Nachrichten-Site nach Eigenangabe, 29K IG Follower — Generalist mit Reichweite. Best contact: Instagram DM + Email. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+radio-okapi@dbc-germany.local', 'Team', 'Rédaction Radio Okapi',
         'Radio Okapi (UN MONUSCO Kinshasa)', 'Rédaction Générale',
         NULL, 'https://www.radiookapi.net', NULL, 'CD', 'CD',
         'Tier 2', 'RDC Online', 'Earned', 'email', 60, false,
         'Hook: Vom UN co-betriebenes Radio in RDC — höchste Glaubwürdigkeit bei urbaner Mittelschicht in Kinshasa. Best contact: Email FR. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        -- ========== Tier 3 — Influencers / Politicians / Activists (13 rows) ==========
        ('unverified+aminata-toure@dbc-germany.local', 'Aminata', 'Touré',
         'Aminata Touré (Ministerin SH, 100K+ IG)',
         'Erste Afro-Deutsche Ministerin (Grüne) Schleswig-Holstein',
         '+49 431 988 0', 'https://www.instagram.com/aminata.toure', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Politik', 'Influencer / Earned', 'email', 60, false,
         'Hook: Vogue-Cover Dec 2022, Symbol für Afro-Empowerment. Schirmherrschaft o. Eventbesuch wäre PR-Gold. Best contact: Pressestelle SH-Ministerium anschreiben + Eventeinladung als Schirmherrin pitchen. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+aminata-belli@dbc-germany.local', 'Aminata', 'Belli',
         'Aminata Belli (MTV/NDR/FUNK Moderatorin)',
         'Journalistin, Moderatorin, Vogue-genannte Anti-Rassismus-Stimme',
         NULL, 'https://www.instagram.com/aminatabelli', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Journalismus', 'Influencer / Earned', 'instagram', 60, false,
         'Hook: Co-Gründerin #Sitzplatzreservierung — wichtige Stimme; verbindet Diaspora + Mainstream. Best contact: Agentur über LinkedIn finden + Eventeinladung. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+tupoka-ogette@dbc-germany.local', 'Tupoka', 'Ogette',
         'Tupoka Ogette (Anti-Rassismus-Trainerin, Spiegel-Bestseller)',
         'Autorin Exit Racism, Tupodcast-Host',
         NULL, 'https://www.tupoka.de', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Bildung', 'Influencer / Speaker', 'web_form', 60, false,
         'Hook: Spiegel-Bestseller-Autorin, hochangesehene Speakerin — als Keynote in einem Panel ziehen? Best contact: Anfrage über tupoka.de — Workshop o. Speech-Slot anbieten. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+marianna-deinyan@dbc-germany.local', 'Marianna', 'Deinyan',
         'Marianna Deinyan (DiasporART Podcast, Cosmo-Journalistin)',
         'Cosmo-Journalistin, DiasporART-Host',
         NULL, 'https://www1.wdr.de/radio/cosmo', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Podcast', 'Influencer / Earned', 'instagram', 60, false,
         'Hook: Podcast über Artists of Color in DE — perfekte Cross-Promo für Kultur-Acts beim Event. Best contact: Email an Cosmo-Redaktion + Pitch. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+charlotte-nzimiro@dbc-germany.local', 'Charlotte', 'Nzimiro',
         'Charlotte Nzimiro (Black Power Germany, Hamburger Morgenpost)',
         'Journalistin, IG-Aktivistin, MoPo-Redakteurin',
         NULL, 'https://www.instagram.com/blackpowergermany', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Journalismus', 'Influencer / Earned', 'instagram', 60, false,
         'Hook: Petitionsleiterin gegen N-Wort, junge Stimme — Diaspora-affin, hat eigene MoPo-Spalte. Best contact: Instagram-Direktnachricht + Press Kit. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+emilene-mudimu@dbc-germany.local', 'Emilene Wopana', 'Mudimu',
         'Emilene Wopana Mudimu (black_is_excellence, Empowerment)',
         'Sozialpädagogin, Workshop-Trainerin',
         NULL, 'https://www.instagram.com/black_is_excellence', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Aktivismus', 'Influencer / Speaker', 'instagram', 60, false,
         'Hook: Schwarzes Empowerment + Afrohaar-Workshops — passt thematisch zu Frauen-/Beauty-Aktivitäten beim Event. Best contact: Instagram-Direktnachricht. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('awet.tesfaiesus.wk@bundestag.de', 'Awet', 'Tesfaiesus',
         'Awet Tesfaiesus (erste Afro-deutsche Bundestagsabgeordnete, Grüne)',
         'MdB Grüne, erste Afro-Deutsche im Bundestag',
         '+49 30 227 77900', 'https://www.awet-tesfaiesus.de', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Politik', 'Influencer / Speaker', 'email', 60, true,
         'Hook: Erste Afro-deutsche Bundestagsabgeordnete — möglich als Gastrednerin oder VIP. Best contact: Email Bürgerbüro mit Eventeinladung. Source: Media Contacts PDF (2026-05).'),

        ('karamba.diaby@bundestag.de', 'Karamba', 'Diaby',
         'Karamba Diaby (SPD MdB, Senegalese-Origin)', 'MdB SPD',
         '+49 30 227 71696', 'https://www.karamba-diaby.de', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Politik DE-NRW', 'Influencer / Speaker', 'email', 60, true,
         'Hook: Dritter Wahlperiode 2025; populärster afrikanischer Politiker in DE — Speaker-Potential. Dr. title. Best contact: Email Bürgerbüro. Source: Media Contacts PDF (2026-05).'),

        ('unverified+ashley-forsson@dbc-germany.local', 'Ashley', 'Forsson',
         'Ashley Forsson (Afro-Deutsche YouTuberin, Ghana-Descent)',
         'YouTube Creator (42.2K Subs), Beauty/Lifestyle/Black-in-Germany',
         NULL, 'https://www.youtube.com/AshleyForsson', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / YouTube', 'Influencer / Paid', 'email', 60, false,
         'Hook: Sehr aktive Afro-deutsche Stimme, Ghana-Descent — Beauty/Lifestyle-affin, passt zum DBC-Diaspora-Style. Best contact: Email + Influencer-Paket (Eventeinladung + Honorar). Placeholder email used (YouTube About inbox). Source: Media Contacts PDF (2026-05).'),

        ('unverified+johanna-kyu@dbc-germany.local', 'Johanna', 'Kyu',
         'Johanna Kyu (Congolese-German Natural Hair / Food)',
         'Congolese-German Wellness/Hair YouTuber',
         NULL, 'https://www.youtube.com/@JohannaKyu', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / YouTube', 'Influencer / Earned', 'instagram', 85, false,
         'Hook: DRC-Wurzeln (!!) und Wellness-Content — perfekte authentische Partnerin für ein Forum mit DRC-Schwerpunkt. Best contact: Instagram-DM mit Eventeinladung + Kollab-Pitch. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+philly-yambo@dbc-germany.local', 'Philly Yambo', 'Makora',
         'Philly Yambo Makora (The Tales of Yambo, AFRONEWS Awards Host)',
         'Founder Tales of Yambo, Corporate Comms Expert, MC',
         NULL, NULL, NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Plattform', 'Influencer / MC', 'linkedin', 60, false,
         'Hook: Erfahrene Eventmoderatorin, hostet AFRONEWS Awards 2021+2022 — perfekte MC-Kandidatin. Best contact: LinkedIn-Anschrift + Speaker/MC-Angebot. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+nyima-bantaba@dbc-germany.local', 'Nyima', 'Bantaba Talk Show',
         'Nyima (Bantaba Talk Show, DE-EN bilingual)',
         'Founder / Producer Bantaba Talk Show',
         NULL, NULL, NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / TV-Talkshow', 'Influencer / Earned', 'instagram', 60, false,
         'Hook: Bilinguales Diaspora-Talkshow-Format — möglich für ein Event-Special / Live-Recording vor Ort. Best contact: Instagram DM + Pitch. Placeholder email used (single name in PDF). Source: Media Contacts PDF (2026-05).'),

        ('unverified+mona-sayadi@dbc-germany.local', 'Mona', 'Sayadi',
         'Mona Sayadi (Düsseldorf Migration/Family Creator)',
         'Düsseldorf-basierte Creator, Migration/Familie/Kultur',
         NULL, 'https://www.instagram.com/mona.sayadi', NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / NRW', 'Influencer / Paid', 'instagram', 60, false,
         'Hook: Lokale NRW-Stimme mit Migrant-Authenticity — passt für Lifestyle-Stories über Event-Besuch. Best contact: Instagram-Direktnachricht. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        -- ========== Tier 3 — Comedy + Podcasts + Diaspora Verbände (9 rows) ==========
        ('unverified+deryagmur@dbc-germany.local', 'Yagmur', 'DerYagmur',
         'DerYagmur / Yagmur (DE Diaspora Creator, TikTok/IG)',
         'Content Creator, Diaspora-Identität',
         NULL, NULL, NULL, 'DE', 'DE',
         'Tier 3', 'Influencer / Comedy', 'Influencer', 'instagram', 30, false,
         'Hook: Authentic Diaspora-Voice (TR-DE, aber relevant für Migration-Diskurs). Best contact: Instagram-Direktnachricht. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        -- Tupoka Ogette also appears in Tier 3 podcasts row (TUPODCAST) —
        -- same person, ON CONFLICT (email) will merge the second insert into
        -- the Tier 3 influencer row above.
        ('unverified+tupoka-ogette@dbc-germany.local', 'Tupoka', 'Ogette',
         'TUPODCAST (Tupoka Ogette)', 'Host TUPODCAST',
         NULL, 'https://www.tupoka.de', NULL, 'DE', 'DE',
         'Tier 3', 'Podcast Diaspora', 'Earned', 'email', 60, false,
         'Also runs TUPODCAST: Schwarze-Frauen-Empowerment-Podcast — eine Episode mit DBC-Bezug wäre Premium-Reichweite. Best contact: Email Pitch — Event-Interview als Folge. Source: Media Contacts PDF (2026-05).'),

        -- Marianna Deinyan duplicate (DiasporART Podcast) — same merge story.
        ('unverified+marianna-deinyan@dbc-germany.local', 'Marianna', 'Deinyan',
         'DiasporART Podcast (Marianna Deinyan)', 'Host DiasporART',
         NULL, NULL, NULL, 'DE', 'DE',
         'Tier 3', 'Podcast Diaspora', 'Earned', 'email', 60, false,
         'Also hosts DiasporART Podcast: Künstler-of-Color-Podcast — perfekt für Kultur-Acts des Forums. Best contact: Email Cosmo-Redaktion. Source: Media Contacts PDF (2026-05).'),

        ('unverified+black-brown-berlin@dbc-germany.local', 'Team', 'Black Brown Berlin Hosts',
         'Black Brown Berlin (Schwarze Stimmen DE)', 'Podcast Hosts',
         NULL, 'https://www.instagram.com/blackbrownberlin', NULL, 'DE', 'DE',
         'Tier 3', 'Podcast Diaspora', 'Earned', 'instagram', 30, false,
         'Hook: Wichtige Berliner BIPOC-Plattform. Best contact: Instagram DM. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        -- Auslandsgesellschaft.de — same email as sponsor seed, ON CONFLICT
        -- will merge into existing contact and add `press` tag in addition
        -- to `partners`.
        ('info@auslandsgesellschaft.de', 'Team', 'Auslandsgesellschaft Pressestelle',
         'Auslandsgesellschaft.de (Dortmund) — Pressestelle', 'Pressesprecher',
         '+49 231 838 00 0', 'https://www.auslandsgesellschaft.de', NULL, 'DE', 'DE',
         'Tier 3', 'Verband Multiplier', 'Cross-Promo', 'email', 60, false,
         'Hook: 10K+ Mitglieder, Multiplier in NRW für internationale Themen. Already in Sponsor List — Cross-Promo via deren Channels. Source: Media Contacts PDF (2026-05).'),

        ('unverified+tang@dbc-germany.local', 'Team', 'TANG Bundesvorstand',
         'TANG — The African Network of Germany (900+ orgs)', 'Bundesvorstand',
         NULL, 'https://tang-organisation.de', NULL, 'DE', 'DE',
         'Tier 3', 'Diaspora-Verband', 'Cross-Promo', 'email', 60, false,
         'Hook: Größter Diaspora-Dachverband Deutschlands, 900+ Mitgliedsorganisationen — ein Newsletter-Mailing = massive Reichweite. Best contact: Email via Femi Awoniyi (African Courier) als Brücke. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+maisha@dbc-germany.local', 'Virginia Wangare', 'Greiner',
         'Maisha e.V. (Frankfurt — African Women & Girls)', 'Gründerin Maisha e.V.',
         '+49 69 95527 181', 'https://maisha.org', NULL, 'DE', 'DE',
         'Tier 3', 'Diaspora-Verband', 'Cross-Promo', 'email', 60, false,
         'Hook: Beste Frauen-Empowerment-Org der Diaspora — ihre Members könnten Frauen-Fokus-Veranstaltungen besuchen. Best contact: Email via maisha.org. Placeholder email used. Source: Media Contacts PDF (2026-05).'),

        ('unverified+nffg@dbc-germany.local', 'Isaac', 'Izoya',
         'Nollywood Film Festival Germany (NFFG)', 'Founder / Director NFFG',
         NULL, 'https://nffg.de', NULL, 'DE', 'DE',
         'Tier 3', 'Diaspora-Verband', 'Cross-Promo', 'email', 30, false,
         'Hook: Best African Festival in Germany 2021 — möglicher Kultur-Partner für die Show-Anteile. Best contact: Email — gemeinsame Kulturveranstaltung pitchen. Placeholder email used (NFFG website / Awards Network). Source: Media Contacts PDF (2026-05).'),

        -- AFRONEWS Awards is hosted by Stephen Ogongo — same email as Tier 1
        -- row, ON CONFLICT merges and the involvement note picks up the
        -- Cross-Promo angle from this row.
        ('info@afronews.de', 'Stephen', 'Ogongo',
         'AFRONEWS Awards Germany', 'CEO AFRONEWS · Hostet AFRONEWS Awards Gala',
         '+39 333 301 0654', 'https://www.afronews.de', NULL, 'IT', 'IT',
         'Tier 3', 'Diaspora-Award', 'Cross-Promo', 'whatsapp', 85, false,
         'Also hosts AFRONEWS Awards Gala: Forum DBC könnte als Sponsor o. Eventkategorie eingereicht werden. Best contact: Whatsapp + möglicher Award-Kategorie Best Diaspora Event 2026 pitchen. Source: Media Contacts PDF (2026-05).')
      ) AS t(email, first_name, last_name, organization, occupation,
             phone, website_url, linkedin_url, country, hq_country,
             tier, sector, pitch_tier, best_contact_method, confidence,
             email_verified, admin_notes)
  LOOP
    INSERT INTO public.contacts (
      email, first_name, last_name, organization, occupation,
      phone, website_url, linkedin_url, country, hq_country,
      tier, sector, pitch_tier, best_contact_method, confidence,
      email_verified, admin_notes, marketing_consent
    ) VALUES (
      lower(v_row.email), v_row.first_name, v_row.last_name, v_row.organization,
      v_row.occupation, v_row.phone, v_row.website_url, v_row.linkedin_url,
      v_row.country, v_row.hq_country, v_row.tier, v_row.sector,
      v_row.pitch_tier, v_row.best_contact_method, v_row.confidence,
      v_row.email_verified, v_row.admin_notes, false
    )
    ON CONFLICT (email) DO UPDATE SET
      first_name = COALESCE(public.contacts.first_name, EXCLUDED.first_name),
      last_name = COALESCE(public.contacts.last_name, EXCLUDED.last_name),
      organization = COALESCE(public.contacts.organization, EXCLUDED.organization),
      occupation = COALESCE(public.contacts.occupation, EXCLUDED.occupation),
      phone = COALESCE(public.contacts.phone, EXCLUDED.phone),
      website_url = COALESCE(public.contacts.website_url, EXCLUDED.website_url),
      linkedin_url = COALESCE(public.contacts.linkedin_url, EXCLUDED.linkedin_url),
      country = COALESCE(public.contacts.country, EXCLUDED.country),
      hq_country = COALESCE(public.contacts.hq_country, EXCLUDED.hq_country),
      tier = COALESCE(public.contacts.tier, EXCLUDED.tier),
      sector = COALESCE(public.contacts.sector, EXCLUDED.sector),
      pitch_tier = COALESCE(public.contacts.pitch_tier, EXCLUDED.pitch_tier),
      best_contact_method = COALESCE(public.contacts.best_contact_method, EXCLUDED.best_contact_method),
      confidence = COALESCE(public.contacts.confidence, EXCLUDED.confidence),
      email_verified = EXCLUDED.email_verified OR public.contacts.email_verified,
      admin_notes = CASE
        WHEN public.contacts.admin_notes IS NULL OR public.contacts.admin_notes = ''
          THEN EXCLUDED.admin_notes
        WHEN public.contacts.admin_notes LIKE '%' || split_part(EXCLUDED.admin_notes, '.', 1) || '%'
          THEN public.contacts.admin_notes
        ELSE public.contacts.admin_notes || E'\n\n' || EXCLUDED.admin_notes
      END,
      updated_at = now()
    RETURNING id INTO v_contact_id;

    INSERT INTO public.contact_category_links (contact_id, category_id)
    VALUES (v_contact_id, v_press)
    ON CONFLICT (contact_id, category_id) DO NOTHING;

    IF v_event IS NOT NULL THEN
      INSERT INTO public.contact_event_involvements (contact_id, event_id, role, notes)
      VALUES (
        v_contact_id, v_event, 'press',
        'Press prospect · Source: Media Contacts PDF (2026-05)'
      )
      ON CONFLICT (contact_id, event_id, role) DO UPDATE SET
        notes = EXCLUDED.notes;
    END IF;
  END LOOP;
END $seed$;
