-- =============================================================================
-- 20260429000003  seed_richesses_2026_funnels
-- =============================================================================
-- Three ticket-sales funnels for Richesses d'Afrique Germany 2026
-- (June 13, 2026 · Essen). Each funnel is a different *angle* on the same
-- event, fully localised in EN / DE / FR, so the ads team can A/B hooks
-- across locales:
--
--   richesses-2026-room       — Authority: who is in the room
--   richesses-2026-outcome    — Walk-away value: intros, mentor, roadmap
--   richesses-2026-community  — Diaspora identity: your people are here
--
-- All three point at the tickets app event page via external_link. The
-- tickets proxy re-derives the locale on landing, so we deliberately
-- leave the locale segment out of the cta_href.
-- =============================================================================

-- ─── Funnel 1 ─────────────────────────────────────────────────────────────
-- Authority angle — the room is the product.
-- -------------------------------------------------------------------------
INSERT INTO public.funnels (
  slug, status, cta_type, cta_href,
  content_en, content_de, content_fr,
  seo_title, seo_description,
  published_at
) VALUES (
  'richesses-2026-room',
  'published',
  'external_link',
  'https://tickets.dbc-germany.com/events/richesses-dafrique-germany-2026',
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · Essen · June 13",
      "title": "The room where Africa-facing capital actually gets done.",
      "subtitle": "One day. One city. The operators, investors, and founders moving real money and building real companies across the African-rooted diaspora in Europe. Panels to open the conversation — the conversation is the point.",
      "primaryCta": "Reserve my seat"
    },
    "benefits": {
      "eyebrow": "Who you'll sit next to",
      "title": "The room is the product.",
      "items": [
        { "key": "founders", "title": "Operators, not tourists", "desc": "Founders running €1M–€50M revenue companies across fintech, health, logistics and the creative economy. Not idea-stage pitch-offs." },
        { "key": "capital",  "title": "Capital that writes checks", "desc": "Funds with an active African-rooted thesis, family offices, and angels who've already cut cheques into diaspora-led rounds." },
        { "key": "builders", "title": "Builders who ship", "desc": "Product, sales and ops leads from companies you'd recognise — available in small-group sessions, not just on stage." },
        { "key": "press",    "title": "The press that covers this lane", "desc": "Journalists and platforms reporting on African-rooted capital — present, curious, and open to off-the-record conversations." }
      ]
    },
    "faq": {
      "title": "Common questions",
      "items": [
        { "q": "Who is this actually for?", "a": "Founders, investors, and senior operators working on African-rooted ventures in Europe. If you're pre-traction or broadly curious, you'll probably get less out of the room." },
        { "q": "Will I get to meet the speakers?", "a": "Yes. The schedule is built around small-group sessions and 1:1 booking windows, not just stage time." },
        { "q": "What language is the event in?", "a": "Main-stage sessions run in English with simultaneous interpretation into German and French. Breakouts happen in whatever language the room prefers." },
        { "q": "Is there a recording?", "a": "Main-stage sessions are recorded. The rooms and hallway conversations that matter most aren't — deliberately." }
      ]
    },
    "footerCta": {
      "text": "Questions before you buy? Write us.",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · Essen · 13. Juni",
      "title": "Der Raum, in dem Afrika-bezogenes Kapital tatsächlich fließt.",
      "subtitle": "Ein Tag. Eine Stadt. Die Operator:innen, Investor:innen und Gründer:innen, die in der afrikanisch verwurzelten Diaspora in Europa wirklich Kapital bewegen und Unternehmen aufbauen. Panels zum Einstieg — die Gespräche sind der Punkt.",
      "primaryCta": "Platz sichern"
    },
    "benefits": {
      "eyebrow": "Wer neben dir sitzt",
      "title": "Der Raum ist das Produkt.",
      "items": [
        { "key": "founders", "title": "Operator:innen, keine Zaungäste", "desc": "Gründer:innen mit €1M–€50M Umsatz in FinTech, Health, Logistik und Creative Economy. Keine Idee-Stage-Pitch-Offs." },
        { "key": "capital",  "title": "Kapital, das wirklich schreibt", "desc": "Fonds mit aktiver afrikanisch verwurzelter These, Family Offices und Angels, die bereits in diaspora-geführte Runden investiert haben." },
        { "key": "builders", "title": "Macher:innen, die liefern", "desc": "Product-, Sales- und Ops-Leads aus Firmen, die du kennst — verfügbar in Kleingruppen, nicht nur auf der Bühne." },
        { "key": "press",    "title": "Die Presse, die diese Szene abdeckt", "desc": "Journalist:innen und Plattformen, die über afrikanisch verwurzeltes Kapital berichten — vor Ort, neugierig, auch off-the-record ansprechbar." }
      ]
    },
    "faq": {
      "title": "Häufige Fragen",
      "items": [
        { "q": "Für wen ist das genau?", "a": "Gründer:innen, Investor:innen und Senior-Operator:innen, die an afrikanisch verwurzelten Ventures in Europa arbeiten. Pre-Traction oder nur neugierig? Dann holst du weniger aus dem Raum raus." },
        { "q": "Komme ich an die Speaker:innen ran?", "a": "Ja. Das Programm ist um Kleingruppen-Sessions und 1:1-Slots gebaut, nicht nur um Bühnenzeit." },
        { "q": "In welcher Sprache läuft das Event?", "a": "Hauptbühnen-Sessions auf Englisch mit Simultanübersetzung ins Deutsche und Französische. Breakouts laufen in der Sprache, die der Raum bevorzugt." },
        { "q": "Gibt es Aufzeichnungen?", "a": "Hauptbühnen-Sessions werden aufgezeichnet. Die Raum- und Flur-Gespräche, die wirklich zählen, bewusst nicht." }
      ]
    },
    "footerCta": {
      "text": "Fragen vor dem Kauf? Schreib uns.",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · Essen · 13 juin",
      "title": "La salle où se fait vraiment le capital autour de l'Afrique.",
      "subtitle": "Une journée. Une ville. Les opérateurs·trices, investisseurs·euses et fondateurs·trices qui déplacent réellement du capital et construisent de vraies entreprises dans la diaspora aux racines africaines en Europe. Les panels ouvrent la conversation — la conversation est le but.",
      "primaryCta": "Réserver ma place"
    },
    "benefits": {
      "eyebrow": "À côté de qui tu seras",
      "title": "La salle, c'est le produit.",
      "items": [
        { "key": "founders", "title": "Des opérateurs, pas des touristes", "desc": "Fondateurs·trices avec €1M–€50M de revenus en fintech, santé, logistique et économie créative. Pas des pitchs au stade idée." },
        { "key": "capital",  "title": "Du capital qui signe vraiment", "desc": "Fonds avec une thèse à racines africaines active, family offices et business angels déjà investis dans des tours menés par la diaspora." },
        { "key": "builders", "title": "Des builders qui livrent", "desc": "Responsables produit, sales et ops d'entreprises que tu connais — disponibles en petit comité, pas seulement sur scène." },
        { "key": "press",    "title": "La presse qui couvre cette scène", "desc": "Journalistes et plateformes qui parlent de capital à racines africaines — présents, curieux, ouverts aux échanges off-the-record." }
      ]
    },
    "faq": {
      "title": "Questions fréquentes",
      "items": [
        { "q": "C'est pour qui exactement ?", "a": "Fondateurs·trices, investisseurs·euses et opérateurs·trices senior qui bossent sur des projets aux racines africaines en Europe. Pré-traction ou juste curieux·se ? Tu tireras moins de la salle." },
        { "q": "Je pourrai rencontrer les intervenants ?", "a": "Oui. Le programme est bâti autour de sessions en petit comité et de créneaux 1:1, pas juste de temps sur scène." },
        { "q": "Dans quelle langue se passe l'événement ?", "a": "Scène principale en anglais avec interprétation simultanée vers l'allemand et le français. Les breakouts se font dans la langue que la salle préfère." },
        { "q": "Est-ce enregistré ?", "a": "Les sessions de scène principale le sont. Les conversations de salle et de couloir — celles qui comptent vraiment — non, c'est volontaire." }
      ]
    },
    "footerCta": {
      "text": "Des questions avant d'acheter ? Écris-nous.",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  'Richesses d''Afrique Germany 2026 — The room for Africa-facing capital | DBC Germany',
  'One day in Essen, June 13. Operators, investors, and founders shaping the African-rooted diaspora economy in Europe.',
  now()
)
ON CONFLICT (slug) DO NOTHING;


-- ─── Funnel 2 ─────────────────────────────────────────────────────────────
-- Outcome angle — what you leave with.
-- -------------------------------------------------------------------------
INSERT INTO public.funnels (
  slug, status, cta_type, cta_href,
  content_en, content_de, content_fr,
  seo_title, seo_description,
  published_at
) VALUES (
  'richesses-2026-outcome',
  'published',
  'external_link',
  'https://tickets.dbc-germany.com/events/richesses-dafrique-germany-2026',
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · June 13 · Essen",
      "title": "Leave Essen with a mentor, three intros, and a 12-month roadmap.",
      "subtitle": "Ten hours that replace ten months of cold outreach. Meet co-founders, capital and customers in a curated room built around conversations — not panels. The program is the network.",
      "primaryCta": "Get my ticket"
    },
    "benefits": {
      "eyebrow": "What you walk away with",
      "title": "Outcomes, not sessions.",
      "items": [
        { "key": "intros",   "title": "3 warm intros, pre-matched", "desc": "We match from your registration profile — founders, investors and operators who actually want to meet you, booked before you arrive." },
        { "key": "mentor",   "title": "1 mentor, six months deep", "desc": "A founder or operator two to three steps ahead of you, paired for a 30-minute working session in Essen and a six-month WhatsApp channel after." },
        { "key": "roadmap",  "title": "A written 12-month roadmap", "desc": "Leave with the three moves that will matter in your next year — reviewed live by an operator who has already made them." },
        { "key": "cohort",   "title": "A peer cohort that continues", "desc": "Automatic invite to the Class of 2026 group: quarterly calls, shared deck reviews, dealflow swaps, warm intros on demand." }
      ]
    },
    "faq": {
      "title": "What you're committing to",
      "items": [
        { "q": "What's actually on the agenda?", "a": "Four main-stage sessions, eight breakout tracks, a curated 1:1 matchmaking hour, and a closing evening organised around dinners of eight. Full schedule ships to ticket-holders 30 days before the event." },
        { "q": "Will I really get the intros and the mentor?", "a": "Yes — we match from your registration profile. Vague profile, vague intros. Real profile, real intros. That's the honest answer." },
        { "q": "What if I can't travel?", "a": "This is an in-person event. The rooms and the dinners are the product; a livestream would defeat the point. If travel is blocking, email us — sometimes we can help." },
        { "q": "Refunds?", "a": "Full refund until 30 days before. 50% until 14 days before. After that no refund, but tickets are transferable to someone you send in your place." }
      ]
    },
    "footerCta": {
      "text": "Still on the fence? Ask us anything.",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · 13. Juni · Essen",
      "title": "Verlass Essen mit einer:m Mentor:in, drei Intros und einem 12-Monats-Fahrplan.",
      "subtitle": "Zehn Stunden, die zehn Monate Cold Outreach ersetzen. Triff Co-Founder:innen, Kapital und Kund:innen in einem kuratierten Raum, der um Gespräche herum gebaut ist — nicht um Panels. Das Programm ist das Netzwerk.",
      "primaryCta": "Ticket holen"
    },
    "benefits": {
      "eyebrow": "Was du mitnimmst",
      "title": "Ergebnisse, keine Sessions.",
      "items": [
        { "key": "intros",   "title": "3 warme Intros, vorab gematcht", "desc": "Wir matchen aus deinem Anmeldeprofil — Gründer:innen, Investor:innen und Operator:innen, die dich wirklich treffen wollen, gebucht bevor du ankommst." },
        { "key": "mentor",   "title": "1 Mentor:in, sechs Monate tief", "desc": "Ein:e Gründer:in oder Operator:in zwei bis drei Schritte vor dir, gekoppelt an eine 30-minütige Arbeits-Session in Essen und einen sechsmonatigen WhatsApp-Kanal danach." },
        { "key": "roadmap",  "title": "Ein schriftlicher 12-Monats-Fahrplan", "desc": "Geh nach Hause mit den drei Schritten, die im nächsten Jahr zählen — live geprüft von einer Person, die sie schon gegangen ist." },
        { "key": "cohort",   "title": "Eine Peer-Kohorte, die weiterläuft", "desc": "Automatische Einladung in die Class of 2026: Quartals-Calls, geteilte Deck-Reviews, Dealflow-Tausch, warme Intros auf Zuruf." }
      ]
    },
    "faq": {
      "title": "Worauf du dich einlässt",
      "items": [
        { "q": "Was steht konkret auf der Agenda?", "a": "Vier Hauptbühnen-Sessions, acht Breakout-Tracks, eine kuratierte 1:1-Matchmaking-Stunde und ein Abschlussabend in 8er-Dinners. Das volle Programm geht 30 Tage vor dem Event an Ticketinhaber:innen raus." },
        { "q": "Bekomme ich die Intros und den:die Mentor:in wirklich?", "a": "Ja — wir matchen aus deinem Anmeldeprofil. Unklares Profil, unklare Intros. Echtes Profil, echte Intros. Das ist die ehrliche Antwort." },
        { "q": "Was, wenn ich nicht reisen kann?", "a": "Das ist ein Präsenz-Event. Die Räume und Dinners sind das Produkt; ein Livestream würde den Sinn zerstören. Wenn Reisen blockiert, schreib uns — manchmal können wir helfen." },
        { "q": "Erstattung?", "a": "Volle Rückerstattung bis 30 Tage vorher. 50% bis 14 Tage vorher. Danach keine Rückerstattung, aber Tickets sind übertragbar — schick jemanden an deiner Stelle." }
      ]
    },
    "footerCta": {
      "text": "Noch unsicher? Frag uns.",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · 13 juin · Essen",
      "title": "Repars d'Essen avec un·e mentor·e, trois intros et une feuille de route sur 12 mois.",
      "subtitle": "Dix heures qui remplacent dix mois de prospection à froid. Rencontre des co-fondateurs·trices, du capital et des clients dans une salle construite autour de conversations — pas de panels. Le programme, c'est le réseau.",
      "primaryCta": "Prendre mon billet"
    },
    "benefits": {
      "eyebrow": "Ce que tu emportes",
      "title": "Des résultats, pas des sessions.",
      "items": [
        { "key": "intros",   "title": "3 intros chaudes, pré-matchées", "desc": "On matche depuis ton profil d'inscription — fondateurs·trices, investisseurs·euses et opérateurs·trices qui veulent vraiment te rencontrer, réservé·e·s avant ton arrivée." },
        { "key": "mentor",   "title": "1 mentor·e, profond·e sur six mois", "desc": "Un·e fondateur·trice ou opérateur·trice deux ou trois pas devant toi, appairé·e pour une session de travail de 30 minutes à Essen et un canal WhatsApp de six mois ensuite." },
        { "key": "roadmap",  "title": "Une feuille de route écrite sur 12 mois", "desc": "Repars avec les trois mouvements qui compteront dans ton année qui vient — relus en direct par quelqu'un qui les a déjà faits." },
        { "key": "cohort",   "title": "Une cohorte de pairs qui continue", "desc": "Invitation automatique à la Class of 2026 : calls trimestriels, relectures de decks partagées, échanges de dealflow, intros chaudes à la demande." }
      ]
    },
    "faq": {
      "title": "Ce à quoi tu t'engages",
      "items": [
        { "q": "C'est quoi concrètement à l'agenda ?", "a": "Quatre sessions scène principale, huit breakouts, une heure de matchmaking 1:1 curatée, et une soirée de clôture en dîners de huit. Le programme complet est envoyé aux détenteurs·trices de billets 30 jours avant." },
        { "q": "J'aurai vraiment les intros et le·la mentor·e ?", "a": "Oui — on matche depuis ton profil d'inscription. Profil flou, intros floues. Profil réel, intros réelles. C'est la réponse honnête." },
        { "q": "Et si je ne peux pas voyager ?", "a": "C'est un événement en présentiel. Les salles et les dîners sont le produit ; un livestream casserait tout. Si le déplacement bloque, écris-nous — parfois on peut aider." },
        { "q": "Remboursement ?", "a": "Remboursement intégral jusqu'à 30 jours avant. 50 % jusqu'à 14 jours avant. Plus rien au-delà, mais les billets sont transférables — envoie quelqu'un à ta place." }
      ]
    },
    "footerCta": {
      "text": "Tu hésites ? Pose-nous tes questions.",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  'Richesses d''Afrique Germany 2026 — Leave with intros, a mentor, a roadmap | DBC Germany',
  'June 13 in Essen. Ten hours that replace ten months of cold outreach. Curated intros, mentor matches, real outcomes.',
  now()
)
ON CONFLICT (slug) DO NOTHING;


-- ─── Funnel 3 ─────────────────────────────────────────────────────────────
-- Community / identity angle — your people are here.
-- -------------------------------------------------------------------------
INSERT INTO public.funnels (
  slug, status, cta_type, cta_href,
  content_en, content_de, content_fr,
  seo_title, seo_description,
  published_at
) VALUES (
  'richesses-2026-community',
  'published',
  'external_link',
  'https://tickets.dbc-germany.com/events/richesses-dafrique-germany-2026',
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · June 13 · Essen",
      "title": "Your people are gathering in Essen.",
      "subtitle": "The African-rooted builders, operators and investors shaping Europe's diaspora economy — together in one room for one day. Come meet your counterparts, your future co-founders, and the capital that already believes in this work.",
      "primaryCta": "Join us in Essen"
    },
    "benefits": {
      "eyebrow": "Why this room matters",
      "title": "You've been doing this alone. You don't have to.",
      "items": [
        { "key": "proximity",  "title": "Proximity to peers", "desc": "Most African-rooted founders in Europe are the only one in their company, their accelerator, their city. For one day, you're not." },
        { "key": "visibility", "title": "Visibility without performance", "desc": "No 'explain where your family is from' onboarding. The room already knows. Skip straight to the work." },
        { "key": "trust",      "title": "Trust built in person", "desc": "Deals and cap-table decisions happen between people who've shared a meal. This is that meal." },
        { "key": "continuity", "title": "Something that continues", "desc": "Essen is the start. The WhatsApp, the quarterly calls, the summer workshops — that's the product." }
      ]
    },
    "faq": {
      "title": "What to expect",
      "items": [
        { "q": "Is this a networking event?", "a": "Not in the LinkedIn sense. The program is built around depth — eight-person dinners, small-room workshops, 1:1 time booked ahead. Business cards aren't the point." },
        { "q": "I'm not of African heritage. Can I come?", "a": "Yes — investors, operators and allies are welcome. The community is African-rooted; the room isn't closed." },
        { "q": "What languages will people speak?", "a": "English, German and French — most people code-switch comfortably. Main-stage sessions run in English with simultaneous interpretation." },
        { "q": "I'm based outside Germany. Worth the trip?", "a": "Attendees this year come from across Europe. Essen is ~2h from Paris, ~4h from London, ~6h from Madrid by train — and Düsseldorf airport is 30 minutes out." }
      ]
    },
    "footerCta": {
      "text": "Want to talk it through first?",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · 13. Juni · Essen",
      "title": "Deine Leute treffen sich in Essen.",
      "subtitle": "Die afrikanisch verwurzelten Builder:innen, Operator:innen und Investor:innen, die Europas Diaspora-Wirtschaft prägen — einen Tag zusammen in einem Raum. Komm und triff deine Gegenüber, deine künftigen Co-Founder:innen und das Kapital, das an diese Arbeit bereits glaubt.",
      "primaryCta": "Mach mit in Essen"
    },
    "benefits": {
      "eyebrow": "Warum dieser Raum zählt",
      "title": "Du hast das lange allein gemacht. Musst du nicht.",
      "items": [
        { "key": "proximity",  "title": "Nähe zu Peers", "desc": "Die meisten afrikanisch verwurzelten Gründer:innen in Europa sind die einzige in ihrer Firma, ihrem Accelerator, ihrer Stadt. An diesem Tag nicht." },
        { "key": "visibility", "title": "Sichtbarkeit ohne Performance", "desc": "Kein 'erklär mal, woher deine Familie kommt'-Onboarding. Der Raum weiß es schon. Direkt zur Arbeit." },
        { "key": "trust",      "title": "Vertrauen baut sich vor Ort", "desc": "Deals und Cap-Table-Entscheidungen passieren zwischen Menschen, die miteinander gegessen haben. Das ist dieses Essen." },
        { "key": "continuity", "title": "Etwas, das weiterläuft", "desc": "Essen ist der Auftakt. Der WhatsApp, die Quartals-Calls, die Sommer-Workshops — das ist das Produkt." }
      ]
    },
    "faq": {
      "title": "Was dich erwartet",
      "items": [
        { "q": "Ist das ein Networking-Event?", "a": "Nicht im LinkedIn-Sinn. Das Programm ist auf Tiefe gebaut — 8er-Dinners, Kleingruppen-Workshops, 1:1-Zeit vorab gebucht. Visitenkarten sind nicht der Punkt." },
        { "q": "Ich bin nicht afrikanisch verwurzelt. Darf ich kommen?", "a": "Ja — Investor:innen, Operator:innen und Verbündete sind willkommen. Die Community ist afrikanisch verwurzelt, der Raum ist aber nicht geschlossen." },
        { "q": "Welche Sprachen werden gesprochen?", "a": "Englisch, Deutsch und Französisch — die meisten wechseln entspannt. Hauptbühnen-Sessions laufen auf Englisch mit Simultanübersetzung." },
        { "q": "Ich komme nicht aus Deutschland. Lohnt die Reise?", "a": "Teilnehmer:innen kommen aus ganz Europa. Essen ist ~2h von Paris, ~4h von London, ~6h von Madrid mit dem Zug — und der Flughafen Düsseldorf liegt 30 Minuten entfernt." }
      ]
    },
    "footerCta": {
      "text": "Erst reden, dann buchen?",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  $json$
  {
    "hero": {
      "eyebrow": "Richesses d'Afrique Germany 2026 · 13 juin · Essen",
      "title": "Les tiens se retrouvent à Essen.",
      "subtitle": "Les builders, opérateurs·trices et investisseurs·euses aux racines africaines qui façonnent l'économie de la diaspora européenne — ensemble, une journée, dans une même salle. Viens rencontrer tes pairs, tes futurs co-fondateurs·trices et le capital qui croit déjà à ce travail.",
      "primaryCta": "Nous rejoindre à Essen"
    },
    "benefits": {
      "eyebrow": "Pourquoi cette salle compte",
      "title": "Tu le fais seul·e depuis longtemps. Plus obligé·e.",
      "items": [
        { "key": "proximity",  "title": "La proximité des pairs", "desc": "La plupart des fondateurs·trices à racines africaines en Europe sont les seul·e·s dans leur boîte, leur accélérateur, leur ville. Ce jour-là, non." },
        { "key": "visibility", "title": "Visibilité sans performance", "desc": "Pas de « raconte d'où vient ta famille ». La salle sait déjà. Droit au travail." },
        { "key": "trust",      "title": "La confiance se construit en présentiel", "desc": "Les deals et les décisions de cap-table se passent entre des gens qui ont mangé ensemble. Ce repas-là, c'est celui-ci." },
        { "key": "continuity", "title": "Quelque chose qui continue", "desc": "Essen, c'est le début. Le WhatsApp, les calls trimestriels, les workshops d'été — c'est ça, le produit." }
      ]
    },
    "faq": {
      "title": "À quoi t'attendre",
      "items": [
        { "q": "C'est du networking ?", "a": "Pas au sens LinkedIn. Le programme est construit sur la profondeur — dîners de huit, workshops en petit comité, temps 1:1 réservé en amont. Les cartes de visite ne sont pas le but." },
        { "q": "Je n'ai pas de racines africaines. Je peux venir ?", "a": "Oui — investisseurs·euses, opérateurs·trices et allié·e·s sont bienvenu·e·s. La communauté est à racines africaines, mais la salle n'est pas fermée." },
        { "q": "Quelles langues parle-t-on ?", "a": "Anglais, allemand, français — la plupart code-switchent sans effort. Scène principale en anglais avec interprétation simultanée." },
        { "q": "Je ne vis pas en Allemagne. Ça vaut le déplacement ?", "a": "Les participant·e·s viennent de toute l'Europe. Essen est à ~2h de Paris, ~4h de Londres, ~6h de Madrid en train — et l'aéroport de Düsseldorf est à 30 minutes." }
      ]
    },
    "footerCta": {
      "text": "Envie d'en parler avant d'acheter ?",
      "email": "hello@dbc-germany.com"
    }
  }
  $json$::jsonb,
  'Richesses d''Afrique Germany 2026 — Your people are gathering | DBC Germany',
  'June 13 in Essen. The African-rooted builders, operators and investors shaping Europe''s diaspora economy, in one room for one day.',
  now()
)
ON CONFLICT (slug) DO NOTHING;
