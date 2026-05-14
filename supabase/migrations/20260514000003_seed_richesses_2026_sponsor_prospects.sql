-- =============================================================================
-- 20260514000003  seed_richesses_2026_sponsor_prospects
-- =============================================================================
-- Inserts the 40 sponsor prospects researched for Richesses d'Afrique Germany
-- 2026, tags each with the `partners` contact category, and creates a
-- `sponsor` involvement on the Richesses 2026 event so they appear under both
-- identity-scoped and event-scoped queries.
--
-- Idempotent: ON CONFLICT (email) DO UPDATE keeps the row aligned with the
-- canonical source (this file) without clobbering admin edits more aggressively
-- than necessary.
--
-- Source: cred/sponsor-contacts-pdf-2026-05.pdf (40 rows).
-- =============================================================================

DO $seed$
DECLARE
  v_event uuid;
  v_partners uuid;
  v_contact_id uuid;
  v_row record;
BEGIN
  SELECT id INTO v_event
    FROM public.events
   WHERE slug = 'richesses-dafrique-germany-2026';

  SELECT id INTO v_partners
    FROM public.contact_categories
   WHERE slug = 'partners';

  IF v_partners IS NULL THEN
    RAISE EXCEPTION 'partners category not found — aborting sponsor seed';
  END IF;

  IF v_event IS NULL THEN
    RAISE NOTICE 'Event richesses-dafrique-germany-2026 not found — sponsor involvements will be skipped';
  END IF;

  FOR v_row IN
    SELECT *
      FROM (VALUES
        -- email | first_name | last_name | organization | occupation | phone | linkedin_url
        -- country | hq_country | tier | sector | pitch_tier | best_contact_method | confidence
        -- email_verified | admin_notes

        -- Tier 1 · Banking
        ('diasporasupport@ubagroup.com', 'Anant', 'Rao',
         'UBA — United Bank for Africa (Group)', 'Head of Diaspora Banking, UBA Group',
         '+234 700 2255 822', NULL,
         'NG', 'NG', 'Tier 1', 'Banking', 'Title / Gold', 'linkedin', 60, false,
         'Best contact: LinkedIn + warm intro via Tshipama. Diasporasupport@ is a team inbox; LinkedIn search "Anant Rao UBA" recommended. Source: Sponsor Contacts PDF (2026-05).'),

        ('rene-laurent.alciator@ubagroup.com', 'Rene-Laurent', 'Alciator',
         'UBA — Paris Rep. Office', 'Head, UBA Representative Office France',
         NULL, 'https://www.linkedin.com/in/rene-laurent-alciator',
         'FR', 'NG', 'Tier 1', 'Banking', 'Gold / Silver', 'linkedin', 60, true,
         'Best contact: LinkedIn InMail then email. Paris office routes via Group switchboard (no direct line). Source: Sponsor Contacts PDF (2026-05).'),

        ('info@ubauk.com', 'Team', 'General Trade Services',
         'UBA UK (Europe HQ)', 'Trade & Treasury Team',
         '+44 20 7766 4600', NULL,
         'GB', 'NG', 'Tier 1', 'Banking', 'Gold', 'email', 85, false,
         'Best contact: Email — formal pitch with attachment. Secondary inbox: tradeservices@ubauk.com. Source: Sponsor Contacts PDF (2026-05).'),

        ('info@ecobank.com', 'Team', 'Group Diaspora Banking',
         'Ecobank Group', 'Group Head, Diaspora Banking (vacant since 2023)',
         '+228 22 21 03 03', NULL,
         'TG', 'TG', 'Tier 1', 'Banking', 'Gold / Silver', 'email', 30, false,
         'Best contact: Use Paris rep office; warm intro better. Role vacant since 2023 — Paris rep is more responsive. Source: Sponsor Contacts PDF (2026-05).'),

        ('unverified+ecobank-paris@dbc-germany.local', 'Team', 'Paris Representative',
         'Ecobank — Paris Rep. Office', 'Representative — Europe & Diaspora',
         NULL, NULL,
         'FR', 'TG', 'Tier 1', 'Banking', 'Silver', 'linkedin', 30, false,
         'Best contact: LinkedIn search "Ecobank Paris representative". Email relays via Group HQ (info@ecobank.com) — synthesized placeholder used here to keep row unique. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 1 · Fintech
        ('press@lemfi.com', 'Ridwan', 'Olalere',
         'LemFi (Rightcard Payment)', 'Co-Founder & CEO, LemFi',
         NULL, 'https://www.linkedin.com/in/ridwanolalere',
         'GB', 'NG', 'Tier 1', 'Fintech', 'Gold / Silver', 'linkedin', 60, false,
         'Best contact: LinkedIn InMail (highest yield). Secondary inbox: partnerships@lemfi.com. UK office (no published direct line). Source: Sponsor Contacts PDF (2026-05).'),

        ('ayoola.salako@lemfi.com', 'Ayoola', 'Salako',
         'LemFi — Marketing', 'Marketing Manager, LemFi',
         NULL, NULL,
         'GB', 'NG', 'Tier 1', 'Fintech', 'Silver', 'linkedin', 60, false,
         'Best contact: LinkedIn first, then email. Email is pattern-guessed (firstname.lastname@). Source: Sponsor Contacts PDF (2026-05).'),

        ('flora.jordano@taptapsend.com', 'Flora', 'Jordano',
         'TapTap Send (Belgium S.A.)', 'Head of BD & Strategic Partnerships',
         '+32 460 20 73 09', NULL,
         'BE', 'GB', 'Tier 1', 'Fintech', 'Silver / Bronze', 'linkedin', 60, true,
         'Best contact: LinkedIn InMail. Source: Sponsor Contacts PDF (2026-05).'),

        ('support@taptapsend.com', 'Team', 'Customer & Press',
         'TapTap Send — Support', 'Support Team — Customer & Press',
         '+44 808 168 7707', NULL,
         'GB', 'GB', 'Tier 1', 'Fintech', 'Bronze', 'email', 85, false,
         'Best contact: Email request, ask to be routed. Source: Sponsor Contacts PDF (2026-05).'),

        ('press@worldremit.com', 'Team', 'Partnerships & Marketing',
         'Zepz Group (WorldRemit + Sendwave)', 'Partnerships & Marketing',
         '+44 20 7821 0815', NULL,
         'GB', 'GB', 'Tier 1', 'Fintech', 'Silver / Gold', 'email', 30, false,
         'Best contact: Email press, request partnerships routing. Secondary inbox: press@sendwave.com. Source: Sponsor Contacts PDF (2026-05).'),

        ('press@nala.com', 'Benjamin', 'Fernandes',
         'Nala', 'Founder & CEO, Nala',
         NULL, 'https://www.linkedin.com/in/benjaminfernandes',
         'GB', 'TZ', 'Tier 1', 'Fintech', 'Bronze / In-Kind', 'linkedin', 60, false,
         'Best contact: LinkedIn (he is active publicly). Secondary inbox: info@nala.com. Phone not published. Source: Sponsor Contacts PDF (2026-05).'),

        ('hi@flutterwavego.com', 'Team', 'Business Development',
         'Flutterwave (Send)', 'Partnerships Team — Business Development',
         NULL, NULL,
         'US', 'NG', 'Tier 1', 'Fintech', 'Bronze', 'email', 30, false,
         'Best contact: Email — formal pitch. Secondary inbox: partnerships@flutterwave.com. Phone not published. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 1 · DFI
        ('deutsche-wirtschaft@deginvest.de', 'Team', 'Abteilung Deutsche Wirtschaft',
         'DEG Köln', 'Department German Economy',
         '+49 221 4986 0', NULL,
         'DE', 'DE', 'Tier 1', 'DFI', 'Silver / In-Kind', 'email', 85, false,
         'Best contact: Email — formal letter from DBC Germany UG. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 1 · Logistics
        ('info@tounetsshipping.com', 'Team', 'Düsseldorf Branch Operations',
         'TouNetsShipping Düsseldorf', 'Branch Operations',
         '+49 211 1636 7824', NULL,
         'DE', 'DE', 'Tier 1', 'Logistics', 'Bronze', 'phone', 60, false,
         'Best contact: Phone first (small operation). Web form is the only published intake — email synthesized from domain. Source: Sponsor Contacts PDF (2026-05).'),

        ('info@africa-container-shipping.com', 'Simon & Jannik', 'Fischer',
         'ACS Africa Container Shipping', 'Co-Owners (CEO + MD)',
         '+41 61 515 67 64', 'https://www.linkedin.com/company/africacontainershipping',
         'CH', 'CH', 'Tier 1', 'Logistics', 'Bronze / Silver', 'email', 85, false,
         'Best contact: Email or LinkedIn. Two co-owners (brothers) share the inbox. Source: Sponsor Contacts PDF (2026-05).'),

        ('unverified+acs-hamburg@dbc-germany.local', 'Team', 'Freight Forwarding — Africa',
         'Africa Container Shipping GmbH (Hamburg)', 'General Contact — Freight Forwarding — Africa',
         NULL, NULL,
         'DE', 'DE', 'Tier 1', 'Logistics', 'Bronze', 'email', 30, false,
         'Best contact: Facebook DM + site form (facebook.com/africacontainershippinggmbh). No public email — placeholder used. Source: Sponsor Contacts PDF (2026-05).'),

        ('info@africashipping.company', 'Team', 'HQ Hamburg Operations & Sales',
         'Africa Shipping Company (Hamburg)', 'HQ Hamburg — Operations & Sales — Europe→West Africa',
         '+49 40 6558 9996', NULL,
         'DE', 'DE', 'Tier 1', 'Logistics', 'Bronze', 'phone', 60, false,
         'Best contact: Phone — phone-first culture. Email synthesized from domain (africashipping.company). Source: Sponsor Contacts PDF (2026-05).'),

        ('info@c-woermann.de', 'Rasmus', 'Woermann',
         'C. Woermann GmbH', 'Managing Partner (also Stellv. Vors. SAFRI)',
         '+49 40 32 81 11 0', 'https://www.linkedin.com/in/rasmus-woermann',
         'DE', 'DE', 'Tier 1', 'Logistics', 'Silver / In-Kind', 'linkedin', 85, false,
         'Best contact: LinkedIn InMail + email (request routing). Doubles as SAFRI deputy chair. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · Airline
        ('kim.daenen@brusselsairlines.com', 'Kim', 'Daenen',
         'Brussels Airlines (Lufthansa)', 'Head of Corporate Comms & Spokesperson',
         '+32 2 723 89 41', NULL,
         'BE', 'BE', 'Tier 2', 'Airline', 'Gold / Silver', 'email', 60, true,
         'Best contact: Press email + LinkedIn search for Africa Marketing Manager. Secondary inbox: press@brusselsairlines.com. Source: Sponsor Contacts PDF (2026-05).'),

        ('marketing@moncongo.com', 'Team', 'Kinshasa Local DRC Marketing',
         'Brussels Airlines — DRC Office', 'Kinshasa Office — Local DRC Marketing',
         NULL, NULL,
         'CD', 'BE', 'Tier 2', 'Airline', 'Bronze / In-Kind', 'email', 30, false,
         'Best contact: Email + Diambilay warm intro. Kinshasa switchboard only — no direct line. Source: Sponsor Contacts PDF (2026-05).'),

        ('info.de@royalairmaroc.com', 'Team', 'German Sales & Marketing',
         'Royal Air Maroc', 'Sales & Marketing Germany',
         '+49 69 13 02 79 79', NULL,
         'DE', 'MA', 'Tier 2', 'Airline', 'Bronze / In-Kind', 'email', 30, false,
         'Best contact: General inbox, request routing. Source: Sponsor Contacts PDF (2026-05).'),

        ('salesfra@ethiopianairlines.com', 'Team', 'Frankfurt Sales Germany',
         'Ethiopian Airlines', 'Sales Germany — Frankfurt',
         '+49 69 770 73 47 47', NULL,
         'DE', 'ET', 'Tier 2', 'Airline', 'Bronze / In-Kind', 'email', 60, false,
         'Best contact: Email — active co-marketing. Source: Sponsor Contacts PDF (2026-05).'),

        ('kontakt.de@airfrance.fr', 'Team', 'Corporate Sales & Marketing Germany',
         'Air France-KLM', 'Corporate & Marketing — Germany',
         '+49 69 86 799 137', NULL,
         'DE', 'FR', 'Tier 2', 'Airline', 'Bronze / In-Kind', 'email', 30, false,
         'Best contact: Email; lower priority. Secondary inbox: corporatesales.de@klm.com. Source: Sponsor Contacts PDF (2026-05).'),

        ('marketing.de@turkishairlines.com', 'Team', 'Marketing & PR Germany',
         'Turkish Airlines', 'Marketing & PR Germany — Düsseldorf',
         '+49 69 65 00 70', NULL,
         'DE', 'TR', 'Tier 2', 'Airline', 'Silver / In-Kind', 'email', 60, false,
         'Best contact: Email — active in event sponsorship. Secondary inbox: duessales@thy.com. Source: Sponsor Contacts PDF (2026-05).'),

        ('info@rwandair.com', 'Team', 'European Sales',
         'RwandAir', 'Sales Europe',
         '+32 2 753 22 88', NULL,
         'BE', 'RW', 'Tier 2', 'Airline', 'Bronze / In-Kind', 'email', 30, false,
         'Best contact: Email — slow response expected. Secondary inbox: sales.brs@rwandair.com. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · Insurance
        ('press@allianz.com', 'Team', 'Africa Region Communications',
         'Allianz Africa', 'Africa Region Communications',
         '+49 89 3800 0', NULL,
         'DE', 'DE', 'Tier 2', 'Insurance', 'Silver', 'email', 30, false,
         'Best contact: Email; corporate, slow. Source: Sponsor Contacts PDF (2026-05).'),

        ('communication@axa-africa.com', 'Team', 'AXA Africa Communications',
         'AXA Africa', 'Africa Region Communications',
         '+33 1 40 75 57 00', NULL,
         'FR', 'FR', 'Tier 2', 'Insurance', 'Silver', 'email', 30, false,
         'Best contact: Email; corporate. Email pattern-guessed (communication@axa-africa.com). Source: Sponsor Contacts PDF (2026-05).'),

        ('info@credassur-consulting.com', 'Esther Misheng', 'Mbidi',
         'Credassur Group Europe', 'Founder & CEO, Credassur Group',
         '+32 486 67 85 77', NULL,
         'BE', 'BE', 'Tier 2', 'Insurance', 'Bronze / Silver', 'linkedin', 85, false,
         'Best contact: LinkedIn or phone — testimonial on landing page. Secondary inbox (executive): E.gommers@credassur-consulting.com. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · VC
        ('isabel@leadersengages.com', 'Élisabeth', 'Moreno',
         'Ring Capital & Ring Africa', 'Chairwoman Ring Capital & President Ring Africa',
         NULL, 'https://fr.linkedin.com/in/elisabeth-s-moreno',
         'FR', 'FR', 'Tier 2', 'VC', 'Gold', 'linkedin', 85, true,
         'Best contact: LinkedIn InMail + LEIA email (isabel@leadersengages.com is her assistant''s routed inbox). Phone not published. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · Fintech / Logistics
        ('contact@nokinoki.com', 'Jonathan', 'Yanghat',
         'Noki Noki Services (NokiPay)', 'Founder & CEO, Noki Noki Services',
         '+242 06 528 66 00', 'https://www.linkedin.com/in/jonathan-yanghat-4722b9229',
         'FR', 'CG', 'Tier 2', 'Fintech', 'Silver', 'linkedin', 85, false,
         'Best contact: LinkedIn — active, responsive. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · NRW Korporates
        ('info@neuman-esser.com', 'Stefanie', 'Peters',
         'NEUMAN & ESSER GROUP', 'Managing Partner, NEA Group',
         '+49 2451 48101', 'https://www.linkedin.com/in/stefanie-peters-39b3733a',
         'DE', 'DE', 'Tier 2', 'NRW Korporates', 'Silver', 'linkedin', 85, false,
         'Best contact: LinkedIn InMail + email. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · Digital Agency
        ('info@krankikom.de', 'Alexander', 'Kranki',
         'Krankikom GmbH (Duisburg)', 'GF & Gründer',
         '+49 203 305970', NULL,
         'DE', 'DE', 'Tier 2', 'Digital Agency', 'Bronze', 'phone', 85, false,
         'Best contact: Phone first — local NRW. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 2 · Verband
        ('christoph.kannengiesser@afrikaverein.de', 'Christoph', 'Kannengießer',
         'Afrika-Verein der deutschen Wirtschaft', 'Hauptgeschäftsführer',
         '+49 30 20 60 71 921', NULL,
         'DE', 'DE', 'Tier 2', 'Verband', 'Cross-Promo', 'email', 85, true,
         'Best contact: Email — verified via Lobbyregister. Source: Sponsor Contacts PDF (2026-05).'),

        ('voss@afrikaverein.de', 'Claudia', 'Voß',
         'Afrika-Verein — Stellv.', 'Stellv. Hauptgeschäftsführerin',
         '+49 30 20 60 71 950', NULL,
         'DE', 'DE', 'Tier 2', 'Verband', 'Cross-Promo', 'email', 85, true,
         'Best contact: Email — verified via Lobbyregister. M.A. credential. Source: Sponsor Contacts PDF (2026-05).'),

        ('unverified+safri@dbc-germany.local', 'Thomas', 'Schäfer',
         'SAFRI', 'SAFRI Vorsitzender (auch VW-Vorstand)',
         NULL, NULL,
         'DE', 'DE', 'Tier 2', 'Verband', 'Cross-Promo', 'email', 60, false,
         'Best contact: Email Afrika-Verein, request SAFRI routing. Direct address not public — placeholder used. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 3 · Beauty
        ('info@spavivent.de', 'E. Ramsay /', 'S. Bartmann',
         'Spa Vivent (Dudu Osun EU Distributor)', 'European Distributor',
         '+49 4165 1350', NULL,
         'DE', 'DE', 'Tier 3', 'Beauty', 'In-Kind', 'phone', 85, false,
         'Best contact: Phone first — small operation. Two co-leads share the inbox. Source: Sponsor Contacts PDF (2026-05).'),

        ('info@tnl.ng', 'Team', 'Tropical Naturals Director',
         'Tropical Naturals Ltd. (HQ)', 'Company Director (Dudu Osun manufacturer)',
         NULL, NULL,
         'NG', 'NG', 'Tier 3', 'Beauty', 'In-Kind', 'email', 30, false,
         'Best contact: Email; lower priority than Spa Vivent (EU distributor is the faster path). Secondary inbox: info@tropical-naturals.com. Phone not published. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 3 · Diaspora Media
        ('unverified+africa-positive@dbc-germany.local', 'Veye', 'Tatah',
         'Africa Positive e.V. (Dortmund)', 'Gründerin & Chefredakteurin (Bundesverdienstkreuz)',
         '+49 231 79 78 590', NULL,
         'DE', 'DE', 'Tier 3', 'Diaspora Media', 'Cross-Promo / In-Kind', 'phone', 85, false,
         'Best contact: Phone — direct, local NRW. No public email; website form is the published intake — placeholder used here. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 3 · Brand (Beer)
        ('press@heineken.com', 'Team', 'Group Brand Marketing — Africa',
         'Heineken Africa (Mutzig/Primus DRC)', 'Brand Marketing — Africa',
         '+31 20 5239 239', NULL,
         'NL', 'NL', 'Tier 3', 'Brand (Beer)', 'In-Kind (Catering)', 'email', 30, false,
         'Best contact: Email; large corporate, slow. Source: Sponsor Contacts PDF (2026-05).'),

        -- Tier 3 · Wirtschaftsförderung
        ('info@auslandsgesellschaft.de', 'Team', 'Geschäftsführung',
         'Auslandsgesellschaft.de (Dortmund)', 'Geschäftsstelle — Geschäftsführung',
         '+49 231 838 00 0', NULL,
         'DE', 'DE', 'Tier 3', 'Wirtschaftsförderung', 'Cross-Promo', 'email', 60, false,
         'Best contact: Email — formal pitch. Source: Sponsor Contacts PDF (2026-05).')
      ) AS t(email, first_name, last_name, organization, occupation, phone, linkedin_url,
             country, hq_country, tier, sector, pitch_tier, best_contact_method, confidence,
             email_verified, admin_notes)
  LOOP
    INSERT INTO public.contacts (
      email, first_name, last_name, organization, occupation, phone, linkedin_url,
      country, hq_country, tier, sector, pitch_tier, best_contact_method, confidence,
      email_verified, admin_notes, marketing_consent
    ) VALUES (
      lower(v_row.email), v_row.first_name, v_row.last_name, v_row.organization,
      v_row.occupation, v_row.phone, v_row.linkedin_url, v_row.country, v_row.hq_country,
      v_row.tier, v_row.sector, v_row.pitch_tier, v_row.best_contact_method, v_row.confidence,
      v_row.email_verified, v_row.admin_notes, false
    )
    ON CONFLICT (email) DO UPDATE SET
      first_name = COALESCE(public.contacts.first_name, EXCLUDED.first_name),
      last_name = COALESCE(public.contacts.last_name, EXCLUDED.last_name),
      organization = COALESCE(public.contacts.organization, EXCLUDED.organization),
      occupation = COALESCE(public.contacts.occupation, EXCLUDED.occupation),
      phone = COALESCE(public.contacts.phone, EXCLUDED.phone),
      linkedin_url = COALESCE(public.contacts.linkedin_url, EXCLUDED.linkedin_url),
      country = COALESCE(public.contacts.country, EXCLUDED.country),
      hq_country = COALESCE(public.contacts.hq_country, EXCLUDED.hq_country),
      tier = COALESCE(public.contacts.tier, EXCLUDED.tier),
      sector = COALESCE(public.contacts.sector, EXCLUDED.sector),
      pitch_tier = COALESCE(public.contacts.pitch_tier, EXCLUDED.pitch_tier),
      best_contact_method = COALESCE(public.contacts.best_contact_method, EXCLUDED.best_contact_method),
      confidence = COALESCE(public.contacts.confidence, EXCLUDED.confidence),
      email_verified = EXCLUDED.email_verified,
      admin_notes = CASE
        WHEN public.contacts.admin_notes IS NULL OR public.contacts.admin_notes = ''
          THEN EXCLUDED.admin_notes
        WHEN public.contacts.admin_notes LIKE '%Sponsor Contacts PDF%'
          THEN public.contacts.admin_notes
        ELSE public.contacts.admin_notes || E'\n\n' || EXCLUDED.admin_notes
      END,
      updated_at = now()
    RETURNING id INTO v_contact_id;

    INSERT INTO public.contact_category_links (contact_id, category_id)
    VALUES (v_contact_id, v_partners)
    ON CONFLICT (contact_id, category_id) DO NOTHING;

    IF v_event IS NOT NULL THEN
      INSERT INTO public.contact_event_involvements (contact_id, event_id, role, notes)
      VALUES (
        v_contact_id, v_event, 'sponsor',
        'Sponsor prospect · Pitch tier: ' || v_row.pitch_tier
      )
      ON CONFLICT (contact_id, event_id, role) DO UPDATE SET
        notes = EXCLUDED.notes;
    END IF;
  END LOOP;
END $seed$;
