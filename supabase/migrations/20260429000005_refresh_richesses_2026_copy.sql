-- =============================================================================
-- 20260429000005  refresh_richesses_2026_copy
-- =============================================================================
-- Replaces the three Richesses-2026 funnel rows with full conversion-funnel
-- copy: problem/agitation/solution story arc, objective proof tiles, bonus
-- (what's included), and a final CTA that scrolls to the pricing section.
-- Also links each funnel to the Richesses event so the renderer shows the
-- countdown + 3-tier pricing table with deep-links straight into checkout.
--
-- Each angle keeps its distinct psychological entry point:
--   room       → authority / proximity
--   outcome    → deliverables / ROI
--   community  → belonging / identity
-- =============================================================================

DO $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT id INTO v_event_id
  FROM public.events
  WHERE slug = 'richesses-dafrique-germany-2026';

  IF v_event_id IS NULL THEN
    RAISE NOTICE 'Event richesses-dafrique-germany-2026 not found — skipping link';
  END IF;

  -- ─── Funnel 1: room ────────────────────────────────────────────────
  UPDATE public.funnels
  SET
    linked_event_id = v_event_id,
    content_en = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · Essen · June 13",
        "title": "The room where Africa-facing capital actually gets done.",
        "subtitle": "One day. One city. The operators, investors, and founders moving real money and building real companies across the African-rooted diaspora in Europe.",
        "primaryCta": "Reserve my seat"
      },
      "proof": {
        "items": [
          { "value": "900", "label": "seats · one day" },
          { "value": "14+", "label": "countries" },
          { "value": "€250M", "label": "collective AUM" },
          { "value": "June 13", "label": "Essen · 2026" }
        ]
      },
      "story": {
        "problem": "You're already building something that matters. But every round, every hire, every partnership is a cold-outreach grind — because the operators and capital who'd actually get it aren't in the rooms you're in.",
        "agitation": "Another quarter of LinkedIn DMs. Another investor who needs you to explain the thesis from zero. Another 'great meeting' that went nowhere. The ceiling on what you can build alone is lower than you think — and you're hitting it.",
        "solution": "One day in Essen. Every person in that room is already two years into the same conversation you're trying to start. You don't pitch. You compare notes."
      },
      "benefits": {
        "eyebrow": "Who you'll sit next to",
        "title": "The room is the product.",
        "items": [
          { "key": "founders", "title": "Operators, not tourists", "desc": "Founders running €1M–€50M revenue companies across fintech, health, logistics and creative economy. Not idea-stage pitch-offs." },
          { "key": "capital",  "title": "Capital that writes checks", "desc": "Funds with an active African-rooted thesis, family offices, and angels who've already cut cheques into diaspora-led rounds." },
          { "key": "builders", "title": "Builders who ship", "desc": "Product, sales and ops leads from companies you'd recognise — available in small-group sessions, not just on stage." },
          { "key": "press",    "title": "The press that covers this lane", "desc": "Journalists and platforms reporting on African-rooted capital — present, curious, open to off-the-record conversations." }
        ]
      },
      "bonus": {
        "title": "Every ticket includes",
        "items": [
          { "title": "Class of 2026 cohort access", "desc": "Quarterly operator calls, shared deck reviews and warm-intro swaps with every attendee for twelve months after Essen." },
          { "title": "Post-event WhatsApp channel", "desc": "The conversations that matter don't end at 18:00 on June 13. The channel keeps the room open all year." },
          { "title": "Full refund until May 30", "desc": "14 days before the event. Tickets stay transferable after that — send someone in your place if plans change." }
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
      "finalCta": {
        "title": "The room fills quietly.",
        "subtitle": "900 seats. Starter, Premium, VIP — pick the one that matches how close you want to get.",
        "primaryCta": "See the tickets"
      },
      "footerCta": {
        "text": "Questions before you buy? Write us.",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb,
    content_de = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · Essen · 13. Juni",
        "title": "Der Raum, in dem Afrika-bezogenes Kapital tatsächlich fließt.",
        "subtitle": "Ein Tag. Eine Stadt. Die Operator:innen, Investor:innen und Gründer:innen, die in der afrikanisch verwurzelten Diaspora in Europa wirklich Kapital bewegen und Unternehmen aufbauen.",
        "primaryCta": "Platz sichern"
      },
      "proof": {
        "items": [
          { "value": "900", "label": "Plätze · ein Tag" },
          { "value": "14+", "label": "Länder" },
          { "value": "€250M", "label": "kumuliertes AUM" },
          { "value": "13. Juni", "label": "Essen · 2026" }
        ]
      },
      "story": {
        "problem": "Du baust bereits etwas, das zählt. Aber jede Runde, jeder Hire, jede Partnerschaft ist Kaltakquise — weil die Operator:innen und Geldgeber:innen, die das verstehen würden, nicht in den Räumen sind, in denen du bist.",
        "agitation": "Noch ein Quartal LinkedIn-DMs. Noch ein Investor, der die These von null erklärt bekommen muss. Noch ein hoffnungsvolles Gespräch, das nirgendwohin führt. Die Decke dessen, was du allein bauen kannst, ist niedriger als du denkst — und du stößt gerade dagegen.",
        "solution": "Ein Tag in Essen. Jede Person im Raum ist schon zwei Jahre weiter in genau dem Gespräch, das du zu beginnen versuchst. Du pitchst nicht. Du tauschst Notizen aus."
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
      "bonus": {
        "title": "In jedem Ticket enthalten",
        "items": [
          { "title": "Class of 2026 Cohort-Zugang", "desc": "Quartals-Operator-Calls, geteilte Deck-Reviews und warme Intros zwischen allen Teilnehmer:innen — zwölf Monate nach Essen." },
          { "title": "Post-Event WhatsApp-Kanal", "desc": "Die Gespräche, die zählen, enden nicht um 18:00 am 13. Juni. Der Kanal hält den Raum das ganze Jahr offen." },
          { "title": "Volle Rückerstattung bis 30. Mai", "desc": "14 Tage vor dem Event. Tickets bleiben übertragbar — schick jemanden an deiner Stelle, wenn sich deine Pläne ändern." }
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
      "finalCta": {
        "title": "Der Raum füllt sich leise.",
        "subtitle": "900 Plätze. Starter, Premium, VIP — wähle, wie nah du dran sein willst.",
        "primaryCta": "Tickets ansehen"
      },
      "footerCta": {
        "text": "Fragen vor dem Kauf? Schreib uns.",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb,
    content_fr = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · Essen · 13 juin",
        "title": "La salle où se fait vraiment le capital autour de l'Afrique.",
        "subtitle": "Une journée. Une ville. Les opérateurs·trices, investisseurs·euses et fondateurs·trices qui déplacent réellement du capital et construisent de vraies entreprises dans la diaspora aux racines africaines en Europe.",
        "primaryCta": "Réserver ma place"
      },
      "proof": {
        "items": [
          { "value": "900", "label": "places · une journée" },
          { "value": "14+", "label": "pays" },
          { "value": "€250M", "label": "AUM cumulé" },
          { "value": "13 juin", "label": "Essen · 2026" }
        ]
      },
      "story": {
        "problem": "Tu construis déjà quelque chose qui compte. Mais chaque tour, chaque recrutement, chaque partenariat se fait à froid — parce que les opérateurs·trices et les capitaux qui comprendraient ne sont pas dans les salles où tu es.",
        "agitation": "Encore un trimestre de DM LinkedIn. Encore un·e investisseur·euse à qui expliquer la thèse depuis zéro. Encore un « super échange » qui ne mène nulle part. Le plafond de ce que tu peux bâtir seul·e est plus bas que tu ne le crois — et tu y es déjà.",
        "solution": "Une journée à Essen. Chaque personne dans la salle est déjà deux ans plus loin dans la conversation que tu essaies de commencer. Tu ne pitches pas. Tu compares tes notes."
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
      "bonus": {
        "title": "Chaque billet comprend",
        "items": [
          { "title": "Accès cohorte Class of 2026", "desc": "Calls opérateurs·trices trimestriels, relectures de decks partagées et intros chaudes entre tous·tes les participant·e·s pendant douze mois." },
          { "title": "Canal WhatsApp post-événement", "desc": "Les conversations qui comptent ne s'arrêtent pas à 18h00 le 13 juin. Le canal garde la salle ouverte toute l'année." },
          { "title": "Remboursement intégral jusqu'au 30 mai", "desc": "14 jours avant l'événement. Les billets restent transférables — envoie quelqu'un à ta place si tes plans changent." }
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
      "finalCta": {
        "title": "La salle se remplit en silence.",
        "subtitle": "900 places. Starter, Premium, VIP — choisis à quelle distance tu veux être.",
        "primaryCta": "Voir les billets"
      },
      "footerCta": {
        "text": "Des questions avant d'acheter ? Écris-nous.",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb
  WHERE slug = 'richesses-2026-room';

  -- ─── Funnel 2: outcome ─────────────────────────────────────────────
  UPDATE public.funnels
  SET
    linked_event_id = v_event_id,
    content_en = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · June 13 · Essen",
        "title": "Leave Essen with a mentor, three intros, and a 12-month roadmap.",
        "subtitle": "Ten hours that replace ten months of cold outreach. Curated intros, mentor matches, a written plan — and a cohort that stays with you for a year.",
        "primaryCta": "Get my ticket"
      },
      "proof": {
        "items": [
          { "value": "3",  "label": "warm intros booked" },
          { "value": "1",  "label": "mentor match, 6 months" },
          { "value": "10h", "label": "in the room" },
          { "value": "12mo", "label": "cohort afterwards" }
        ]
      },
      "story": {
        "problem": "You keep showing up at the right conferences and leaving with a stack of business cards that never turn into anything. Weeks pass. No intros materialise. The roadmap you meant to work on is still in draft.",
        "agitation": "Every month you wait is a month your competitor compounds. The cost of not making the next three moves isn't theoretical — it's the hire you can't afford yet, the round you're still pitching, the product launch that keeps slipping.",
        "solution": "This event is built around outputs, not sessions. You arrive with a profile. You leave with named people in your calendar, a mentor working through your actual numbers, and a written 12-month plan reviewed by someone who's made these moves before."
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
      "bonus": {
        "title": "Included with every ticket",
        "items": [
          { "title": "Pre-event matching intake", "desc": "Two weeks before Essen you fill a 10-minute profile. That's how we book the right 3 conversations, not the random ones." },
          { "title": "Signed roadmap template", "desc": "Take home the exact frame the operators in the room are using — 3 moves per quarter, reviewed live." },
          { "title": "Full refund until May 30", "desc": "14 days before the event. Tickets stay transferable — send someone in your place if plans change." }
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
      "finalCta": {
        "title": "Ten hours. Three ways to leave ready.",
        "subtitle": "Starter, Premium, or VIP — the curation scales with you.",
        "primaryCta": "Choose my ticket"
      },
      "footerCta": {
        "text": "Still on the fence? Ask us anything.",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb,
    content_de = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · 13. Juni · Essen",
        "title": "Verlass Essen mit einer:m Mentor:in, drei Intros und einem 12-Monats-Fahrplan.",
        "subtitle": "Zehn Stunden, die zehn Monate Cold Outreach ersetzen. Kuratierte Intros, Mentor-Matches, ein schriftlicher Plan — und eine Kohorte, die ein Jahr bei dir bleibt.",
        "primaryCta": "Ticket holen"
      },
      "proof": {
        "items": [
          { "value": "3",  "label": "warme Intros gebucht" },
          { "value": "1",  "label": "Mentor-Match · 6 Monate" },
          { "value": "10h", "label": "im Raum" },
          { "value": "12 Mo", "label": "Kohorte danach" }
        ]
      },
      "story": {
        "problem": "Du tauchst auf den richtigen Konferenzen auf und gehst mit einem Stapel Visitenkarten, aus denen nie etwas wird. Wochen vergehen. Keine Intros materialisieren. Der Fahrplan, den du angehen wolltest, liegt immer noch als Entwurf da.",
        "agitation": "Jeder Monat, den du wartest, ist ein Monat, in dem der Wettbewerb Zinseszinsen kassiert. Die Kosten, die nächsten drei Schritte nicht zu machen, sind nicht theoretisch — es ist der Hire, den du dir noch nicht leisten kannst, die Runde, die du noch pitchst, der Launch, der immer wieder rutscht.",
        "solution": "Dieses Event ist um Outputs gebaut, nicht um Sessions. Du kommst mit einem Profil. Du gehst mit konkreten Menschen in deinem Kalender, einer Mentor:in, die an deinen echten Zahlen arbeitet, und einem schriftlichen 12-Monats-Plan, live geprüft von einer Person, die diese Schritte schon gegangen ist."
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
      "bonus": {
        "title": "In jedem Ticket enthalten",
        "items": [
          { "title": "Pre-Event-Matching-Intake", "desc": "Zwei Wochen vor Essen füllst du ein 10-Minuten-Profil. Darüber buchen wir die richtigen drei Gespräche, nicht die zufälligen." },
          { "title": "Signierte Roadmap-Vorlage", "desc": "Nimm genau das Framework mit nach Hause, das die Operator:innen im Raum nutzen — 3 Schritte pro Quartal, live geprüft." },
          { "title": "Volle Rückerstattung bis 30. Mai", "desc": "14 Tage vor dem Event. Tickets bleiben übertragbar — schick jemanden an deiner Stelle, wenn sich deine Pläne ändern." }
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
      "finalCta": {
        "title": "Zehn Stunden. Drei Wege, bereit rauszugehen.",
        "subtitle": "Starter, Premium oder VIP — die Kuratierung skaliert mit dir.",
        "primaryCta": "Ticket wählen"
      },
      "footerCta": {
        "text": "Noch unsicher? Frag uns.",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb,
    content_fr = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · 13 juin · Essen",
        "title": "Repars d'Essen avec un·e mentor·e, trois intros et une feuille de route sur 12 mois.",
        "subtitle": "Dix heures qui remplacent dix mois de prospection à froid. Des intros curées, un match mentor, un plan écrit — et une cohorte qui t'accompagne un an.",
        "primaryCta": "Prendre mon billet"
      },
      "proof": {
        "items": [
          { "value": "3",  "label": "intros chaudes réservées" },
          { "value": "1",  "label": "match mentor · 6 mois" },
          { "value": "10h", "label": "dans la salle" },
          { "value": "12 mois", "label": "cohorte ensuite" }
        ]
      },
      "story": {
        "problem": "Tu vas aux bonnes conférences et tu repars avec une pile de cartes de visite qui ne deviennent rien. Des semaines passent. Aucune intro ne se concrétise. La feuille de route sur laquelle tu voulais bosser est toujours un brouillon.",
        "agitation": "Chaque mois d'attente est un mois où la concurrence capitalise. Le coût de ne pas faire les trois prochains mouvements n'est pas théorique — c'est le recrutement que tu ne peux pas encore t'offrir, le tour que tu pitches encore, le lancement qui glisse toujours.",
        "solution": "Cet événement est construit autour de livrables, pas de sessions. Tu arrives avec un profil. Tu repars avec des gens nommés dans ton agenda, un·e mentor·e qui travaille sur tes vrais chiffres, et un plan écrit sur 12 mois relu en direct par quelqu'un qui a déjà fait ces pas."
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
      "bonus": {
        "title": "Inclus avec chaque billet",
        "items": [
          { "title": "Intake de matching pré-événement", "desc": "Deux semaines avant Essen, tu remplis un profil de 10 minutes. C'est ce qui nous permet de réserver les bons trois échanges, pas les aléatoires." },
          { "title": "Modèle de feuille de route signé", "desc": "Repars avec le cadre exact qu'utilisent les opérateurs·trices de la salle — 3 mouvements par trimestre, relus en direct." },
          { "title": "Remboursement intégral jusqu'au 30 mai", "desc": "14 jours avant l'événement. Les billets restent transférables — envoie quelqu'un à ta place si tes plans changent." }
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
      "finalCta": {
        "title": "Dix heures. Trois façons d'en sortir prêt·e.",
        "subtitle": "Starter, Premium ou VIP — la curation s'ajuste à toi.",
        "primaryCta": "Choisir mon billet"
      },
      "footerCta": {
        "text": "Tu hésites ? Pose-nous tes questions.",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb
  WHERE slug = 'richesses-2026-outcome';

  -- ─── Funnel 3: community ───────────────────────────────────────────
  UPDATE public.funnels
  SET
    linked_event_id = v_event_id,
    content_en = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · June 13 · Essen",
        "title": "Your people are gathering in Essen.",
        "subtitle": "The African-rooted builders, operators and investors shaping Europe's diaspora economy — together in one room for one day. Come meet your counterparts, your future co-founders, and the capital that already believes in this work.",
        "primaryCta": "Join us in Essen"
      },
      "proof": {
        "items": [
          { "value": "900", "label": "in the room" },
          { "value": "14+", "label": "countries" },
          { "value": "8", "label": "dinners of 8" },
          { "value": "1", "label": "year of community" }
        ]
      },
      "story": {
        "problem": "You're the only African-rooted founder in your accelerator. The only senior operator of your background in the leadership team. The only one at the table when the thesis meeting is about 'Africa'. You get asked to explain where your family is from before you get asked what you're building.",
        "agitation": "This doesn't fix itself. Another year passes, another round of 'I should introduce you to the other person working on this'. The cost isn't just lonely — it's slower companies, quieter cap tables, careers that plateau because the network never forms.",
        "solution": "One day in Essen changes the map. Every person in the room already knows. You skip the explanation and go straight to the work — then you take the room with you into a year of quarterly calls, shared reviews, and warm intros."
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
      "bonus": {
        "title": "A year of the room, not one day",
        "items": [
          { "title": "Class of 2026 WhatsApp channel", "desc": "The people you meet at dinner stay reachable afterwards. Warm intros on demand, shared deck reviews, dealflow swaps — for twelve months." },
          { "title": "Quarterly peer calls", "desc": "Structured operator calls that keep the cohort compounding long after Essen. Attend the ones that matter for your quarter." },
          { "title": "Full refund until May 30", "desc": "14 days before the event. Tickets stay transferable — send someone in your place if plans change." }
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
      "finalCta": {
        "title": "One room. One day. Then a year of each other.",
        "subtitle": "Starter, Premium, VIP — the room is the same; the depth scales.",
        "primaryCta": "Take my seat"
      },
      "footerCta": {
        "text": "Want to talk it through first?",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb,
    content_de = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · 13. Juni · Essen",
        "title": "Deine Leute treffen sich in Essen.",
        "subtitle": "Die afrikanisch verwurzelten Builder:innen, Operator:innen und Investor:innen, die Europas Diaspora-Wirtschaft prägen — einen Tag zusammen in einem Raum. Komm und triff deine Gegenüber, deine künftigen Co-Founder:innen und das Kapital, das an diese Arbeit bereits glaubt.",
        "primaryCta": "Mach mit in Essen"
      },
      "proof": {
        "items": [
          { "value": "900", "label": "im Raum" },
          { "value": "14+", "label": "Länder" },
          { "value": "8", "label": "8er-Dinners" },
          { "value": "1", "label": "Jahr Community" }
        ]
      },
      "story": {
        "problem": "Du bist die einzige afrikanisch verwurzelte Gründer:in in deinem Accelerator. Die einzige Senior-Operator:in mit deinem Hintergrund im Leadership-Team. Die einzige am Tisch, wenn das Thesis-Meeting über Afrika geht. Man fragt dich, woher deine Familie kommt, bevor man fragt, was du baust.",
        "agitation": "Das löst sich nicht von selbst. Noch ein Jahr vergeht, noch eine Runde aus höflichen Verbindungen, die nie zu einem echten Gespräch werden. Die Kosten sind nicht nur Einsamkeit — es sind langsamere Firmen, leisere Cap-Tables, Karrieren, die stagnieren, weil das Netzwerk nie entsteht.",
        "solution": "Ein Tag in Essen ändert die Karte. Jede Person im Raum weiß es schon. Du überspringst die Erklärung und gehst direkt zur Arbeit — dann nimmst du den Raum mit in ein Jahr aus Quartals-Calls, geteilten Reviews und warmen Intros."
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
      "bonus": {
        "title": "Ein Jahr Raum, nicht ein Tag",
        "items": [
          { "title": "Class of 2026 WhatsApp-Kanal", "desc": "Die Menschen, die du beim Dinner triffst, bleiben danach erreichbar. Warme Intros auf Zuruf, geteilte Deck-Reviews, Dealflow-Tausch — zwölf Monate lang." },
          { "title": "Quartals-Peer-Calls", "desc": "Strukturierte Operator-Calls, die die Kohorte auch nach Essen zusammenhalten. Besuch die, die für dein Quartal zählen." },
          { "title": "Volle Rückerstattung bis 30. Mai", "desc": "14 Tage vor dem Event. Tickets bleiben übertragbar — schick jemanden an deiner Stelle, wenn sich deine Pläne ändern." }
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
      "finalCta": {
        "title": "Ein Raum. Ein Tag. Dann ein Jahr miteinander.",
        "subtitle": "Starter, Premium, VIP — der Raum ist derselbe; die Tiefe skaliert.",
        "primaryCta": "Platz nehmen"
      },
      "footerCta": {
        "text": "Erst reden, dann buchen?",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb,
    content_fr = $json$
    {
      "hero": {
        "eyebrow": "Richesses d'Afrique Germany 2026 · 13 juin · Essen",
        "title": "Les tiens se retrouvent à Essen.",
        "subtitle": "Les builders, opérateurs·trices et investisseurs·euses aux racines africaines qui façonnent l'économie de la diaspora européenne — ensemble, une journée, dans une même salle. Viens rencontrer tes pairs, tes futurs co-fondateurs·trices et le capital qui croit déjà à ce travail.",
        "primaryCta": "Nous rejoindre à Essen"
      },
      "proof": {
        "items": [
          { "value": "900", "label": "dans la salle" },
          { "value": "14+", "label": "pays" },
          { "value": "8", "label": "dîners de 8" },
          { "value": "1", "label": "an de communauté" }
        ]
      },
      "story": {
        "problem": "Tu es le·la seul·e fondateur·trice aux racines africaines de ton accélérateur. Le·la seul·e opérateur·trice senior de ton parcours dans l'équipe de direction. Le·la seul·e à la table quand la réunion de thèse parle d'« Afrique ». On te demande d'où vient ta famille avant de te demander ce que tu construis.",
        "agitation": "Ça ne se règle pas tout seul. Une année passe encore, encore un « je devrais te présenter à l'autre personne qui bosse là-dessus ». Le coût n'est pas juste la solitude — ce sont des entreprises plus lentes, des cap-tables plus silencieuses, des carrières qui plafonnent parce que le réseau ne se forme pas.",
        "solution": "Une journée à Essen change la carte. Chaque personne dans la salle sait déjà. Tu sautes l'explication et vas droit au travail — puis tu emportes la salle avec toi dans une année de calls trimestriels, de relectures partagées et d'intros chaudes."
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
      "bonus": {
        "title": "Une année de la salle, pas une journée",
        "items": [
          { "title": "Canal WhatsApp Class of 2026", "desc": "Les gens que tu rencontres au dîner restent joignables après. Intros chaudes à la demande, relectures de decks partagées, échanges de dealflow — pendant douze mois." },
          { "title": "Calls de pairs trimestriels", "desc": "Calls opérateurs·trices structurés qui font grandir la cohorte bien après Essen. Viens à ceux qui comptent pour ton trimestre." },
          { "title": "Remboursement intégral jusqu'au 30 mai", "desc": "14 jours avant l'événement. Les billets restent transférables — envoie quelqu'un à ta place si tes plans changent." }
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
      "finalCta": {
        "title": "Une salle. Un jour. Puis une année ensemble.",
        "subtitle": "Starter, Premium, VIP — la salle est la même ; la profondeur s'ajuste.",
        "primaryCta": "Prendre ma place"
      },
      "footerCta": {
        "text": "Envie d'en parler avant d'acheter ?",
        "email": "hello@dbc-germany.com"
      }
    }
    $json$::jsonb
  WHERE slug = 'richesses-2026-community';

END $$;
