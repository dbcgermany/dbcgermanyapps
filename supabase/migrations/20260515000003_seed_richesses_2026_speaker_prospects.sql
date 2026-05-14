-- =============================================================================
-- 20260515000003  seed_richesses_2026_speaker_prospects
-- =============================================================================
-- Inserts the speaker PROSPECTS (people we want on stage but haven't yet
-- engaged) into the contacts table, tags them with the new `speakers`
-- category, and creates a `speaker` involvement on the Richesses 2026 event.
--
-- The 7 already-CONFIRMED speakers from the PDF (Rau, Rubambura, Tshipama,
-- Diambilay, Bambi, Lungidi, Domena) are explicitly EXCLUDED — they already
-- live in the public `speakers` table and are tracked separately; this seed
-- only covers outreach pipeline.
--
-- Many prospects already exist as contacts from the sponsor and media seeds
-- (Moreno, Mbidi, Yanghat, Rao, Fischer, Woermann, Kannengießer, Tcheumeleu);
-- ON CONFLICT (email) DO UPDATE merges the speaker context into the existing
-- row and the `speakers` category tag is added alongside whatever else is
-- there.
--
-- Source: cred/speakers-candidates-pdf-2026-05.pdf (33 prospect rows).
-- =============================================================================

DO $seed$
DECLARE
  v_event uuid;
  v_speakers uuid;
  v_contact_id uuid;
  v_row record;
BEGIN
  SELECT id INTO v_event
    FROM public.events
   WHERE slug = 'richesses-dafrique-germany-2026';

  SELECT id INTO v_speakers
    FROM public.contact_categories
   WHERE slug = 'speakers';

  IF v_speakers IS NULL THEN
    RAISE EXCEPTION 'speakers category not found — run migration 20260515000001 first';
  END IF;

  IF v_event IS NULL THEN
    RAISE NOTICE 'Event richesses-dafrique-germany-2026 not found — speaker involvements will be skipped';
  END IF;

  FOR v_row IN
    SELECT *
      FROM (VALUES
        -- email | first_name | last_name | organization | occupation
        -- phone | website_url | linkedin_url | country | hq_country
        -- tier | sector | best_contact_method | confidence
        -- email_verified | admin_notes

        -- ========== Tier 0 — warm network (4 rows) ==========
        ('isabel@leadersengages.com', 'Élisabeth', 'Moreno',
         'Ring Capital & Ring Africa',
         'Chairwoman, Ring Capital & Ring Africa · President ADWIN Foundation · ex-French Minister · ex-HP Africa CEO',
         NULL, 'https://www.ringcapital.com', 'https://fr.linkedin.com/in/elisabeth-s-moreno', 'FR', 'FR',
         'Tier 0', 'VC / Policy', 'linkedin', 85, true,
         'Hook: Marraine 2025 Paris edition + named DBC partner publicly via ADWIN; March 2026 AfricaPresse interview confirms active relationship. Suggested session: Keynote — Female entrepreneurship + EU-Africa capital flows. Source: Speaker Candidates PDF (2026-05).'),

        ('info@credassur-consulting.com', 'Esther Misheng', 'Mbidi',
         'Credassur Group Europe/Afrique',
         'CEO & Founder, Credassur Group Europe/Afrique · Country Chair G100 Belgium',
         '+32 486 67 85 77', 'https://credassurgroup.org', NULL, 'BE', 'BE',
         'Tier 0', 'Insurance / Diaspora', 'linkedin', 85, false,
         'Hook: Publicly confirmed her own presence at Forum (Nov 2025 LinkedIn post Montréal edition). Suggested session: Panel — De-risking Africa investments (insurance, credit, structured finance). Secondary inbox (executive): E.gommers@credassur-consulting.com. Brussels HQ + Kinshasa operations. Source: Speaker Candidates PDF (2026-05).'),

        ('contact@nokinoki.com', 'Jonathan', 'Yanghat',
         'NokiPay · Noki Noki Services',
         'Founder & President, NokiPay · Founder, Noki Noki Services',
         '+242 06 528 66 00', 'https://www.nokinoki.com', 'https://www.linkedin.com/in/jonathan-yanghat-4722b9229', 'FR', 'CG',
         'Tier 0', 'Fintech', 'linkedin', 85, false,
         'Hook: Panéliste Paris 2025; positive testimonial already published. Suggested session: Panel — Diaspora payments and remittance infrastructure (CG/DRC corridor). Paris primary, Brazzaville secondary. Source: Speaker Candidates PDF (2026-05).'),

        ('diasporasupport@ubagroup.com', 'Anant', 'Rao',
         'United Bank for Africa Group',
         'Head of Diaspora Banking, United Bank for Africa Group',
         '+234 700 2255 822', 'https://www.ubagroup.com', NULL, 'NG', 'NG',
         'Tier 0', 'Banking', 'linkedin', 60, false,
         'Hook: Already in DBC sponsor list — sponsorship pitch can include speaker slot. Suggested session: Panel — African banking infrastructure for the diaspora. Source: Speaker Candidates PDF (2026-05).'),

        -- ========== Tier 1 — realistic German/EU diaspora (20 rows) ==========
        ('info@africagreentec.com', 'Torsten', 'Schreiber',
         'Africa GreenTec AG',
         'Co-Founder & Activist, Africa GreenTec AG · Solartainer pioneer',
         '+49 6182 84 999 0', 'https://africagreentec.com', 'https://www.linkedin.com/in/torstenschreiber', 'DE', 'DE',
         'Tier 1', 'Energy / CleanTech', 'linkedin', 85, false,
         'Hook: Hessen-based, well-known LinkedIn Top Voice. Speaks German, very accessible. Wife from Mali → personal Africa link. Office now in Frankfurt TechQuartier. Suggested session: Keynote — Building a German-African social enterprise (crowdfunding, off-grid solar, lessons from 6 Sahel countries). Co-founder Aida Schreiber shares this inbox (see separate contact). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+aida-schreiber@dbc-germany.local', 'Aida', 'Schreiber',
         'Africa GreenTec AG',
         'Co-Founder & COO, Africa GreenTec AG (Malian-German)',
         '+49 6182 84 999 0', 'https://africagreentec.com', NULL, 'DE', 'ML',
         'Tier 1', 'Energy / CleanTech', 'email', 85, false,
         'Hook: Malian-born co-founder — speaks French, English, Bambara, German. Strong women-empowerment angle. Suggested session: Panel — Women, energy access, rural African entrepreneurship. Shares info@africagreentec.com with co-founder Torsten Schreiber (placeholder email used to keep two distinct contacts). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+erick-yong@dbc-germany.local', 'Erick', 'Yong',
         'GreenTec Capital Partners',
         'Co-Founder & CEO, GreenTec Capital Partners · German-African venture builder',
         '+49 69 95 64 87 30', 'https://greentec-capital.com', 'https://www.linkedin.com/in/erickyong', 'DE', 'DE',
         'Tier 1', 'VC / Venture Building', 'linkedin', 85, false,
         'Hook: Frankfurt-based VC building 50+ African ventures since 2015. German-Cameroonian background. Speaks French, English, German. Highly accessible. Suggested session: Panel — How EU-based VCs identify, fund and scale African startups. Contact via greentec-capital.com form (placeholder email used). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+karim-beguir@dbc-germany.local', 'Karim', 'Beguir',
         'InstaDeep (BioNTech)',
         'Co-Founder & CEO, InstaDeep (acquired by BioNTech for $700M)',
         NULL, 'https://www.instadeep.com', 'https://www.linkedin.com/in/karimbeguir', 'GB', 'TN',
         'Tier 1', 'Telecom / Media', 'linkedin', 60, false,
         'Hook: Built Africa''s biggest AI exit. London-based now. Speaks French + English fluently. Works with BioNTech (German). Active speaker (TIME100, WEF). Tunisian-French background. Suggested session: Keynote — Africa''s first $700M AI exit and what 10 InstaDeeps could look like. Contact via instadeep.com (placeholder email used). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+fatoumata-ba@dbc-germany.local', 'Fatoumata', 'Ba',
         'Janngo Capital',
         'Founder & Executive Chair, Janngo Capital (€60M fund) · Chairwoman Auchan Africa · ex-Jumia',
         NULL, 'https://janngo.africa', 'https://www.linkedin.com/in/fatoumataba', 'FR', 'SN',
         'Tier 1', 'VC / Tech', 'linkedin', 60, false,
         'Hook: Senegalese, Paris-based, WEF Young Global Leader, Forbes 30 Under 30. EIB-backed gender-equal Africa VC fund. Suggested session: Keynote — Female-led venture capital across the continent + lessons from Jumia. Placeholder email used (janngo.africa contact form). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+yves-kabongo@dbc-germany.local', 'Yves', 'Kabongo',
         'Novcorp · Tantalex Lithium Resources',
         'Founder & CEO, Novcorp · Board member Tantalex Lithium Resources (TSX-listed)',
         NULL, NULL, NULL, 'CD', 'CD',
         'Tier 1', 'Mining / Trading', 'linkedin', 60, false,
         'Hook: Young Congolese 30s, mining (3T) entrepreneur, first to list on Toronto stock exchange. Speaks French. Already pitched to international investors. Suggested session: Panel — Strategic minerals (3T, lithium, cobalt) — opportunities for DRC + EU. Kinshasa + Canada link. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+thomas-strouvens@dbc-germany.local', 'Thomas', 'Strouvens',
         'Youdee',
         'Co-Founder, Youdee (DRC real-estate platform) · Belgian-Congolese roots',
         NULL, 'https://youdee.cd', NULL, 'CD', 'BE',
         'Tier 1', 'Tech / Diaspora-Africa', 'linkedin', 60, false,
         'Hook: Belgian-Congolese, moved to Kinshasa 2018, built tech platform with 5K visits/month. Speaks French. Direct DRC entrepreneurship case. Suggested session: Panel — Returning to build in DRC (the day-to-day of moving from Brussels to Kinshasa). Brussels + Kinshasa. Placeholder email used (youdee.cd contact). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+gladys-kazadi@dbc-germany.local', 'Gladys', 'Kazadi',
         'Les Engagés · Brussels Parliament',
         'Vice-President Les Engagés party · Brussels Parliament member · Congolese origin',
         NULL, 'https://parlement.brussels', NULL, 'BE', 'CD',
         'Tier 1', 'Politics / Diaspora', 'linkedin', 60, false,
         'Hook: 28y, Brussels parliamentary, Congolese diaspora''s leading political voice. Speaks French perfectly. Strong DRC-Belgium bridge. Suggested session: Panel — Diaspora political agency + EU-DRC relations. Placeholder email used (via parlement.brussels — groupe Les Engagés). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+mossadeck-bally@dbc-germany.local', 'Mossadeck', 'Bally',
         'Azalaï Hotels Group',
         'Founder & CEO, Azalaï Hotels Group (700 employees, 8 countries West Africa)',
         NULL, NULL, 'https://www.linkedin.com/in/mossadeck-bally', 'ML', 'ML',
         'Tier 1', 'Hospitality', 'linkedin', 60, false,
         'Hook: Highly visible African Hospitality leader. Speaks French and English. Frequent speaker (Africa CEO Forum 2024-2025). Sees diaspora as priority recruitment pool. USA-trained. Suggested session: Keynote — Pan-African hospitality (building 8-country regional empire from West Africa). Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+florence-adepoju@dbc-germany.local', 'Florence ''Flow''', 'Adepoju',
         'MDMflow',
         'Founder, MDMflow (vegan inclusive UK beauty brand)',
         NULL, 'https://mdmflow.com', NULL, 'GB', 'NG',
         'Tier 1', 'Beauty / Cosmetic Science', 'linkedin', 60, false,
         'Hook: Forbes 30 Under 30 2018 (Podcast series). UK-Nigerian, perfect for Bossmetics-adjacent angle. Speaker at MOBO, London College of Fashion alumna. Speaks English. Suggested session: Panel — Building inclusive beauty brands from EU → African diaspora market. Placeholder email used (mdmflow.com contact). Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+iyinoluwa-aboyeji@dbc-germany.local', 'Iyinoluwa ''E''', 'Aboyeji',
         'Future Africa',
         'Founding Partner, Future Africa · co-founder Andela + Flutterwave',
         NULL, 'https://futureafrica.vc', 'https://www.linkedin.com/in/eaboyeji', 'NG', 'NG',
         'Tier 1', 'VC / Pan-African Investor', 'linkedin', 60, false,
         'Hook: Co-founder of 2 African unicorns. WEF Young Global Leader. Speaks English. Frequent speaker (Africa CEO Forum, London Tech Week). Waterloo Canada-trained. Suggested session: Keynote — Building Andela + Flutterwave: what Europe-based founders need to know. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('info@africa-container-shipping.com', 'Simon & Jannik', 'Fischer',
         'ACS Africa Container Shipping',
         'Co-Owners (CEO + MD), ACS Africa Container Shipping',
         '+41 61 515 67 64', 'https://africa-container-shipping.com', 'https://www.linkedin.com/company/africacontainershipping', 'CH', 'CH',
         'Tier 1', 'Logistics / Shipping', 'linkedin', 85, false,
         'Hook: Already in DBC sponsor list — natural cross-sell. Two young EU-Africa logistics entrepreneurs. Speaks German. Basel + DE. Suggested session: Panel — How to send your first container to Africa without losing it (exactly what event copy promises). Source: Speaker Candidates PDF (2026-05).'),

        ('info@c-woermann.de', 'Rasmus', 'Woermann',
         'C. Woermann GmbH',
         'Managing Partner, C. Woermann GmbH · Stellv. Vors. SAFRI',
         '+49 40 32 81 11 0', 'https://www.c-woermann.de', 'https://www.linkedin.com/in/rasmus-woermann', 'DE', 'DE',
         'Tier 1', 'Trade / German Mittelstand', 'linkedin', 85, false,
         'Hook: Already in DBC sponsor list. 4-generation German-African trading family. Hamburg HQ. Speaks German, English, French. SAFRI deputy chair = direct connection to BMZ. Suggested session: Panel — 130 years of German Mittelstand in Africa (practical export/import playbook). Source: Speaker Candidates PDF (2026-05).'),

        ('christoph.kannengiesser@afrikaverein.de', 'Christoph', 'Kannengießer',
         'Afrika-Verein der deutschen Wirtschaft',
         'Hauptgeschäftsführer, Afrika-Verein der deutschen Wirtschaft (500+ members)',
         '+49 30 20 60 71 921', 'https://www.afrikaverein.de', NULL, 'DE', 'DE',
         'Tier 1', 'Verband / Multiplier', 'email', 85, true,
         'Hook: Already in DBC sponsor list. Verified via Lobbyregister. Speaks at every Germany-Africa event. Speaks German + English + French. Suggested session: Keynote — Where is German Mittelstand putting money in Africa right now? Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+sabine-dallomo@dbc-germany.local', 'Sabine', 'Dall''Omo',
         'Siemens South Africa · Afrika-Verein',
         'Chairperson Afrika-Verein der deutschen Wirtschaft · CEO Siemens South Africa (since 2023)',
         '+49 30 20 60 71 921', 'https://www.afrikaverein.de', NULL, 'DE', 'DE',
         'Tier 1', 'Verband / Women in Business', 'linkedin', 60, false,
         'Hook: Top female German-Africa business voice. Direct Siemens / DE Mittelstand authority. Speaks German + English. Suggested session: Keynote — Siemens in Africa (how a global corporation operates across the continent). Route via Afrika-Verein direct. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+lutz-hartmann@dbc-germany.local', 'Lutz', 'Hartmann',
         'Belmont Legal · FruitBox Africa GmbH',
         'Founding Partner Belmont Legal · Lead investor FruitBox Africa GmbH (300ha Ethiopia farm)',
         NULL, 'https://belmont-legal.com', NULL, 'DE', 'DE',
         'Tier 1', 'Agribusiness', 'email', 60, false,
         'Hook: Frankfurt commercial lawyer leading German private investors into Ethiopian agriculture. German + French + English. Suggested session: Panel — How a German Mittelstand investor group bought 300ha in Ethiopia (case study). Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('rainer@afrikaverein.de', 'Anna Sophia', 'Rainer',
         'German Agribusiness Alliance · Afrika-Verein',
         'Africa Advisor, German Agribusiness Alliance · Afrika-Verein',
         '+49 30 20 60 71 0', 'https://www.afrikaverein.de', NULL, 'DE', 'DE',
         'Tier 1', 'Agribusiness Advisor', 'email', 60, true,
         'Hook: Studied African Science in Leipzig, Naples, Dar Es Salaam. Speaks German, English, Swahili. Direct expertise on Northern + Western Africa agri. Suggested session: Panel — Agri-business opportunities in Africa for German Mittelstand. Source: Speaker Candidates PDF (2026-05).'),

        ('redaktion@lonam.de', 'Hervé', 'Tcheumeleu',
         'LoNam Magazin',
         'Geschäftsführer & Chefredakteur, LoNam Magazin (Africa-Diaspora print)',
         '+49 30 552 083 33', 'https://www.lonam.de', NULL, 'DE', 'CM',
         'Tier 1', 'Pan-African Media', 'email', 60, false,
         'Hook: Cameroonian-German, runs largest German-language Africa magazine since 2009. Speaks German + French + English. Already in Media Contacts list = double-use. Suggested session: Panel — How to communicate with the African diaspora in Germany (media strategy). Secondary inbox: info@lonam.de. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+daddy-kabeyal@dbc-germany.local', 'Daddy', 'Kabeyal',
         'WapiMED',
         'Country Manager, WapiMED (Congolese healthtech)',
         NULL, 'https://wapimed.com', NULL, 'CD', 'BE',
         'Tier 1', 'Tech / Diaspora SaaS', 'linkedin', 60, false,
         'Hook: Studied in Europe before returning to DRC. Built healthtech platform for diaspora-to-DRC medical payments. French native. Suggested session: Panel — Diaspora-funded healthtech for Africa (the WapiMED case). Brussels + Kinshasa. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('contact@atepa.com', 'Pierre Goudiaby', 'Atepa',
         'Atepa Group',
         'Founder, Atepa Group · architect African Renaissance Monument · ''Architect of West Africa''',
         NULL, 'https://atepa.com', NULL, 'SN', 'SN',
         'Tier 1', 'Architecture / Urbanism', 'email', 60, false,
         'Hook: 75y, Rensselaer Polytechnic (NY) alumnus. Major pan-African statesman of urbanism. Speaks French + English. New Steel & Aluminum Road project. Suggested session: Keynote — African self-sufficient cities (Steel & Aluminum Alliance vision). Source: Speaker Candidates PDF (2026-05).'),

        -- ========== Tier 2 — pan-African senior (5 rows) ==========
        ('unverified+ndidi-nwuneli@dbc-germany.local', 'Ndidi Okonkwo', 'Nwuneli',
         'Sahel Consulting · AACE Foods · LEAP Africa · Nourishing Africa',
         'Managing Partner Sahel Consulting · Co-Founder AACE Foods · Founder LEAP Africa & Nourishing Africa',
         NULL, 'https://leapafrica.org', NULL, 'NG', 'NG',
         'Tier 2', 'Food / Agribusiness', 'email', 60, false,
         'Hook: Wharton + Harvard MBA, McKinsey alum (Chicago, NY, Joburg). WEF Young Global Leader. Rockefeller Foundation board. TED Global speaker. Author Routledge. Suggested session: Keynote — Food entrepreneurship in Africa (from 10K farmers to global retail). Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+sanyade-okoli@dbc-germany.local', 'Sanyade', 'Okoli',
         'Alpha African Advisory',
         'CEO, Alpha African Advisory (capital raising, M&A, project finance Nigeria)',
         NULL, 'https://alphaafricanadvisory.com', NULL, 'NG', 'NG',
         'Tier 2', 'Banking / Finance Advisor', 'email', 60, false,
         'Hook: Cambridge MBA. ICAEW chartered accountant. 21+ years financial advisory for African deals. Speaks English. Suggested session: Panel — Raising capital for African deals from Europe (what works). Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+vera-songwe@dbc-germany.local', 'Vera', 'Songwe',
         'Liquidity & Sustainability Facility · Brookings',
         'Chair, Liquidity & Sustainability Facility · ex-UN ECA Under-Secretary-General · Brookings Senior Fellow',
         NULL, 'https://www.brookings.edu', NULL, 'CM', 'CM',
         'Tier 2', 'Finance / Macroeconomics', 'email', 30, false,
         'Hook: Forbes Most Influential Africans regular. PhD UCLouvain Belgium → direct francophone Europe link. Speaks French + English. Cameroonian-born. Suggested session: Keynote — Africa''s macro economy and SDR/debt (what changes for EU investors in 2026). Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+frannie-leautier@dbc-germany.local', 'Frannie', 'Léautier',
         'SouthBridge Investments',
         'Senior Partner, SouthBridge Investments · ex-AfDB Senior VP',
         NULL, 'https://southbridge.com', NULL, 'TZ', 'TZ',
         'Tier 2', 'VC / Pan-African', 'email', 30, false,
         'Hook: MIT PhD, World Bank Chief of Staff to President. Co-founded Fezembat in France. Speaks Swahili, French, English. Board AZA Finance, Norsad, FSD-Africa. Suggested session: Keynote — Senior PE perspective on African opportunity for European LPs. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+bishop-jocktane@dbc-germany.local', 'Mike Steeve', 'Jocktane',
         'Forum Richesses d''Afrique Libreville 2025',
         'Évêque général · Co-organisateur Forum Richesses d''Afrique Libreville 2025',
         NULL, NULL, NULL, 'GA', 'GA',
         'Tier 2', 'Hospitality / Tourism', 'email', 60, false,
         'Hook: Already publicly committed to DBC''s mission. Has co-organized Forum Libreville 2025 with Diambilay. Speaks French. Suggested session: Honorary speaker / patron role — Spiritual + economic empowerment angle. Bishop title. Placeholder email used (via gabonactu.com / DBC network). Source: Speaker Candidates PDF (2026-05).'),

        -- ========== Tier 3 — aspirational long-shots (4 rows) ==========
        ('unverified+tony-elumelu@dbc-germany.local', 'Tony', 'Elumelu',
         'Heirs Holdings · UBA · Tony Elumelu Foundation',
         'Group Chairman, Heirs Holdings · Chairman UBA · Founder Tony Elumelu Foundation',
         NULL, 'https://tonyelumelufoundation.org', NULL, 'NG', 'NG',
         'Tier 3', 'Banking / Industry', 'email', 30, false,
         'Hook: TIME100 2026. Funded 15K+ entrepreneurs across 54 African countries. ALREADY in DBC sponsor target list (UBA). Standard fee €100K+ but TEF events sometimes pro-bono. Suggested session: Keynote — Africapitalism (democratizing prosperity for African entrepreneurs). London property too. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+aliko-dangote@dbc-germany.local', 'Aliko', 'Dangote',
         'Dangote Group',
         'Founder, Dangote Group · Africa''s richest man · TIME100 2026',
         NULL, 'https://www.dangote.com', NULL, 'NG', 'NG',
         'Tier 3', 'Industry / Manufacturing', 'email', 30, false,
         'Hook: Long-shot. But even a 10-min video message from him would be transformative PR. Suggested session: Long-shot — video message or in-person keynote. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+mo-ibrahim@dbc-germany.local', 'Mo', 'Ibrahim',
         'Celtel · Mo Ibrahim Foundation',
         'Founder, Celtel · Founder Mo Ibrahim Foundation · Founder Celtel International',
         NULL, 'https://mo.ibrahim.foundation', NULL, 'GB', 'SD',
         'Tier 3', 'Industry / Energy', 'email', 30, false,
         'Hook: Built Celtel ($3.4B sale). Sudanese-British, London-based. Strong DACH connection (German pension funds invested). Suggested session: Long-shot keynote — Building a $3.4B African telecom from London. Placeholder email used. Source: Speaker Candidates PDF (2026-05).'),

        ('unverified+stefan-liebing@dbc-germany.local', 'Stefan', 'Liebing',
         'Conjuncta GmbH',
         'ex-Chairman Afrika-Verein der deutschen Wirtschaft · CEO Conjuncta GmbH (green H2 Africa)',
         NULL, 'https://conjuncta.com', NULL, 'DE', 'DE',
         'Tier 3', 'Bilateral Economy', 'email', 60, false,
         'Hook: Past Afrika-Verein chair. Now Conjuncta builds green hydrogen in Africa. Very high profile in DE-Africa diplomacy. Speaks German + English. Dr. title. Suggested session: Keynote — Green hydrogen (the next German-African mega-trade). Placeholder email used. Source: Speaker Candidates PDF (2026-05).')

      ) AS t(email, first_name, last_name, organization, occupation,
             phone, website_url, linkedin_url, country, hq_country,
             tier, sector, best_contact_method, confidence,
             email_verified, admin_notes)
  LOOP
    INSERT INTO public.contacts (
      email, first_name, last_name, organization, occupation,
      phone, website_url, linkedin_url, country, hq_country,
      tier, sector, best_contact_method, confidence,
      email_verified, admin_notes, marketing_consent
    ) VALUES (
      lower(v_row.email), v_row.first_name, v_row.last_name, v_row.organization,
      v_row.occupation, v_row.phone, v_row.website_url, v_row.linkedin_url,
      v_row.country, v_row.hq_country, v_row.tier, v_row.sector,
      v_row.best_contact_method, v_row.confidence,
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
      best_contact_method = COALESCE(public.contacts.best_contact_method, EXCLUDED.best_contact_method),
      confidence = COALESCE(public.contacts.confidence, EXCLUDED.confidence),
      email_verified = EXCLUDED.email_verified OR public.contacts.email_verified,
      admin_notes = CASE
        WHEN public.contacts.admin_notes IS NULL OR public.contacts.admin_notes = ''
          THEN EXCLUDED.admin_notes
        WHEN public.contacts.admin_notes LIKE '%Speaker Candidates PDF%'
          THEN public.contacts.admin_notes
        ELSE public.contacts.admin_notes || E'\n\n' || EXCLUDED.admin_notes
      END,
      updated_at = now()
    RETURNING id INTO v_contact_id;

    INSERT INTO public.contact_category_links (contact_id, category_id)
    VALUES (v_contact_id, v_speakers)
    ON CONFLICT (contact_id, category_id) DO NOTHING;

    IF v_event IS NOT NULL THEN
      INSERT INTO public.contact_event_involvements (contact_id, event_id, role, notes)
      VALUES (
        v_contact_id, v_event, 'speaker',
        'Speaker prospect · Source: Speaker Candidates PDF (2026-05)'
      )
      ON CONFLICT (contact_id, event_id, role) DO UPDATE SET
        notes = EXCLUDED.notes;
    END IF;
  END LOOP;
END $seed$;
