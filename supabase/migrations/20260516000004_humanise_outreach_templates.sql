-- =============================================================================
-- 20260516000004  humanise_outreach_templates
-- =============================================================================
-- Round three of the outreach copy. The prior two drafts read AI-generated —
-- long sentences, hedged language, generic openings ("I'm reaching out because…").
-- This pass tightens every line so the recipient gets the impression a person
-- wrote it: shorter sentences, concrete sector hook, one ask per email, no
-- corporate filler. Dynamic variables (firstName, organization, sector, tier,
-- event title/date/city, sender) are kept and made structural — the email
-- breaks visibly when the operator forgets to fill them in.
--
-- Re-runs ON CONFLICT (slug) DO UPDATE — admin edits made via
-- /admin/outreach/templates ARE overwritten by this migration. Future tweaks
-- should be made via the editor, not new migrations.
-- =============================================================================

INSERT INTO public.outreach_templates (
  slug, name, description, reply_to,
  subject_en, subject_de, subject_fr,
  body_en, body_de, body_fr,
  is_system, sort_order
) VALUES
-- ----- Sponsor pitch -------------------------------------------------------
(
  'sponsor_pitch',
  'Sponsor pitch',
  'Cold first-touch to a sponsor prospect. Opens with a sector-tied hook, lays out the room + the {pitchTier}-tier ask, links the deck + event page, closes with a 20-min call request.',
  'sponsors@dbc-germany.com',
  '{eventTitle} — partnership idea for {organization}',
  '{eventTitle} — Partnerschafts-Idee für {organization}',
  '{eventTitle} — proposition de partenariat pour {organization}',
  $body_en$Hi {firstName},

Quick one. We're putting on {eventTitle} on {eventDate} in {eventCity} — one room, 400 senior people, half African business leaders and half DACH operators who already do business with Africa. The kind of audience {organization} doesn't get to talk to often.

I had {organization} pegged as a {pitchTier}-tier partner. The deck spells out what that includes (visibility, programme placement, who you meet) and we shape it from there.

Sponsor pack: {sponsorDeckUrl}
The event: {eventUrl}

Worth 20 minutes next week to see if it fits?

{senderName}
DBC Germany UG$body_en$,
  $body_de$Hallo {firstName},

kurz und direkt: Wir veranstalten {eventTitle} am {eventDate} in {eventCity} — ein Saal, 400 hochkarätige Teilnehmer, etwa zur Hälfte afrikanische Wirtschaftsentscheider und zur Hälfte DACH-Operatoren, die bereits in Afrika unterwegs sind. Eine Zielgruppe, die {organization} sonst selten an einem Tisch hat.

{organization} habe ich als {pitchTier}-Partner skizziert. Das Deck zeigt im Detail, was darin enthalten ist (Sichtbarkeit, Programm-Platzierung, Wer-trifft-wen) — und wir formen es von dort aus.

Sponsor-Deck: {sponsorDeckUrl}
Das Event: {eventUrl}

20 Minuten nächste Woche, um zu sehen, ob das passt?

{senderName}
DBC Germany UG$body_de$,
  $body_fr$Bonjour {firstName},

Rapide et direct : nous organisons {eventTitle} le {eventDate} à {eventCity} — une salle, 400 personnes de haut niveau, environ moitié dirigeants africains, moitié opérateurs DACH déjà actifs en Afrique. Une audience que {organization} a rarement l'occasion de réunir.

J'ai positionné {organization} en partenaire {pitchTier}. Le dossier précise ce que cela inclut (visibilité, placement programme, à qui vous parlez) et nous l'ajustons ensuite.

Dossier sponsor : {sponsorDeckUrl}
L'événement : {eventUrl}

20 minutes la semaine prochaine pour voir si cela colle ?

{senderName}
DBC Germany UG$body_fr$,
  true,
  10
),

-- ----- Press pitch ---------------------------------------------------------
(
  'press_pitch',
  'Press pitch',
  'Cold first-touch to a journalist. Leads with the editorial hook tied to the contact''s sector, links press kit + event page, offers accreditation / interview / advance briefing.',
  'press@dbc-germany.com',
  '{eventCity}, {eventDate} — story angle for {organization}',
  '{eventCity}, {eventDate} — Themenangebot für {organization}',
  '{eventCity}, le {eventDate} — angle pour {organization}',
  $body_en$Hi {firstName},

On {eventDate}, {eventCity} hosts {eventTitle}. One room, 400 senior people, half African business leaders, half DACH operators with active deals on the continent. Given how {organization} covers {sector}, there's a story here that doesn't show up in the regular Africa-business news cycle.

The press kit has the speaker shortlist, the embargoed materials, and the angles we think work best for your readers.

Press kit: {pressKitUrl}
Event details: {eventUrl}

Happy to set up accreditation, line up on-site interviews, or arrange an advance briefing with one of the keynotes — whatever fits your editorial calendar. Just tell me which.

{senderName}
DBC Germany UG$body_en$,
  $body_de$Hallo {firstName},

am {eventDate} findet in {eventCity} {eventTitle} statt. Ein Saal, 400 hochkarätige Teilnehmer, etwa zur Hälfte afrikanische Wirtschaftsentscheider und zur Hälfte DACH-Operatoren mit aktiven Deals auf dem Kontinent. Wie {organization} {sector} abdeckt, sehe ich hier eine Geschichte, die im üblichen Afrika-Wirtschaftsnews-Zyklus nicht auftaucht.

Die Pressemappe enthält die Speaker-Shortlist, Sperrfrist-Materialien und die Angles, die wir für Ihre Leser:innen am stärksten halten.

Pressemappe: {pressKitUrl}
Event-Details: {eventUrl}

Akkreditierung, Vor-Ort-Interviews oder ein Vorab-Briefing mit einer Keynote richte ich gern ein — sagen Sie mir einfach, was zu Ihrem Redaktionsplan passt.

{senderName}
DBC Germany UG$body_de$,
  $body_fr$Bonjour {firstName},

Le {eventDate}, {eventCity} accueille {eventTitle}. Une salle, 400 personnes de haut niveau, moitié dirigeants africains, moitié opérateurs DACH avec des deals actifs sur le continent. Vu la manière dont {organization} couvre {sector}, il y a là un sujet qui n'apparaît pas dans le cycle habituel des nouvelles business-Afrique.

Le dossier de presse contient la shortlist des intervenants, les matériaux sous embargo et les angles qui nous semblent les plus forts pour vos lecteurs.

Dossier de presse : {pressKitUrl}
Détails de l'événement : {eventUrl}

Accréditation, interviews sur place ou briefing préalable avec une keynote — dites-moi simplement ce qui s'inscrit dans votre planning éditorial.

{senderName}
DBC Germany UG$body_fr$,
  true,
  20
),

-- ----- Speaker pitch -------------------------------------------------------
(
  'speaker_pitch',
  'Speaker pitch',
  'Cold first-touch to a speaker prospect. Names the slot + audience profile, links the public event page, asks for a yes-in-principle.',
  'speakers@dbc-germany.com',
  '{eventTitle} — invitation to speak ({eventDate}, {eventCity})',
  '{eventTitle} — Speaking-Einladung ({eventDate}, {eventCity})',
  '{eventTitle} — invitation à intervenir ({eventDate}, {eventCity})',
  $body_en$Hi {firstName},

We're inviting you to speak at {eventTitle} on {eventDate} in {eventCity}.

The room is one stage, 400 senior people — half African business leaders, half DACH operators already doing business with Africa. The work you do at {organization} in {sector} is exactly what this audience comes to hear.

Format is yours: a 20-minute keynote, a 35-minute fireside, or a moderated panel. We cover travel + hotel; honorarium depends on the slot and we'll talk that through directly.

Programme + audience profile: {eventUrl}

If it's a yes in principle, I'll send the slot positioning and three dates for a 15-minute prep call.

{senderName}
DBC Germany UG$body_en$,
  $body_de$Hallo {firstName},

wir möchten Sie als Sprecher:in zu {eventTitle} am {eventDate} in {eventCity} einladen.

Eine Bühne, 400 hochkarätige Teilnehmer — etwa zur Hälfte afrikanische Wirtschaftsentscheider und zur Hälfte DACH-Operatoren, die bereits in Afrika unterwegs sind. Was Sie bei {organization} im Bereich {sector} machen, ist genau das, wofür dieses Publikum kommt.

Das Format ist Ihres: 20-minütige Keynote, 35-minütiger Fireside-Talk oder ein moderiertes Panel. Wir übernehmen Reise + Hotel; das Honorar besprechen wir direkt, je nach Slot.

Programm + Publikumsprofil: {eventUrl}

Ein „grundsätzlich ja" reicht — danach schicke ich Ihnen die Slot-Positionierung und drei Terminvorschläge für ein 15-minütiges Vorgespräch.

{senderName}
DBC Germany UG$body_de$,
  $body_fr$Bonjour {firstName},

Nous souhaitons vous inviter à intervenir à {eventTitle}, le {eventDate} à {eventCity}.

Une seule scène, 400 personnes de haut niveau — environ moitié dirigeants africains, moitié opérateurs DACH qui font déjà des affaires en Afrique. Ce que vous faites chez {organization} dans {sector} correspond précisément à ce que ce public vient écouter.

Le format est le vôtre : keynote de 20 minutes, fireside de 35 minutes ou panel modéré. Nous prenons en charge transport et hôtel ; les honoraires se discutent directement selon le créneau.

Programme + profil du public : {eventUrl}

Un « oui de principe » suffit — je vous enverrai ensuite le positionnement du créneau et trois propositions de date pour un échange préparatoire de 15 minutes.

{senderName}
DBC Germany UG$body_fr$,
  true,
  30
)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  reply_to    = EXCLUDED.reply_to,
  subject_en  = EXCLUDED.subject_en,
  subject_de  = EXCLUDED.subject_de,
  subject_fr  = EXCLUDED.subject_fr,
  body_en     = EXCLUDED.body_en,
  body_de     = EXCLUDED.body_de,
  body_fr     = EXCLUDED.body_fr,
  is_system   = EXCLUDED.is_system,
  sort_order  = EXCLUDED.sort_order;
