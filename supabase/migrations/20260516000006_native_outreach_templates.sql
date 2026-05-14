-- =============================================================================
-- 20260516000006  native_outreach_templates
-- =============================================================================
-- Final pass: native-feeling subjects + bodies in each language, no
-- advertising tropes (bullet lists, hype phrases). The prior v5 still read
-- as a promotional pitch in places — and the speaker subject "Invitation
-- to address {eventTitle}" was not idiomatic English.
--
-- What changes here:
--   • Subjects use native business-correspondence phrasing per locale, not
--     literal translations (EN "Speaking invitation", DE "Sprecher-
--     Einladung", FR "Invitation à intervenir"; sponsor uses "Partnership
--     request" / "Partnerschaftsanfrage" / "Demande de partenariat";
--     press keeps "Press accreditation" / "Presseakkreditierung" /
--     "Accréditation presse").
--   • Bodies are compact (≈900–1100 chars), formal request register, no
--     bullet lists. The leitgedanke is kept (locale-correct) but woven
--     into prose, not stacked as a slide.
--   • Each language is written natively, not back-translated.
--
-- Companion change shipped in the same release: the {salutation} helper is
-- now strict — title + LAST name when known, "Sehr geehrte Damen und
-- Herren," / "Dear Sir or Madam," / "Madame, Monsieur," when not. First
-- names are never used in cold-outreach salutations.
--
-- Re-runs ON CONFLICT (slug) DO UPDATE. Future copy tweaks should be made
-- via /admin/outreach/templates, not new migrations.
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
  'Formal partnership request to a sponsor prospect. Native register in each language; no bullet lists or advertising tropes.',
  'sponsors@dbc-germany.com',
  'Partnership request — {eventTitle} ({eventCity}, {eventDate})',
  'Partnerschaftsanfrage – {eventTitle} ({eventCity}, {eventDate})',
  'Demande de partenariat – {eventTitle} ({eventCity}, le {eventDate})',
  $body_en$ {salutation}

DBC Germany UG will hold its MasterClass {eventTitle} on {eventDate} in {eventCity}, at {eventVenue}.

The day is intended for members of the African diaspora and DACH investors who wish to engage commercially with the continent. Sessions are led by entrepreneurs who operate successful businesses in Africa. The working theme is "Invest in Africa. Structure, secure and capitalise on opportunity."

We are writing to ask whether {organization} would consider a partnership at the {pitchTier} level. The attached pack sets out what such a partnership includes — visibility, programme presence and access to the audience — and we are open to adjusting the terms to your priorities.

Event details
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Sponsor pack: {sponsorDeckUrl}
Programme: {eventUrl}

We would be grateful for the opportunity to discuss this with you briefly, at your convenience.

With kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

die DBC Germany UG veranstaltet am {eventDate} in {eventCity} die MasterClass {eventTitle} – in der {eventVenue}.

Der Tag richtet sich an Vertreter der afrikanischen Diaspora sowie an DACH-Investoren, die ein wirtschaftliches Engagement auf dem Kontinent prüfen. Die Sessions werden von Unternehmern geführt, die erfolgreich operative Geschäfte in Afrika verantworten. Das Leitthema lautet: „In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren."

Wir wenden uns an Sie mit der Anfrage, ob {organization} eine Partnerschaft auf {pitchTier}-Niveau in Betracht ziehen würde. Die beigefügte Unterlage beschreibt, was eine solche Partnerschaft umfasst – Sichtbarkeit, Programmpräsenz und Zugang zum Publikum – und wir richten die Konditionen gerne an Ihren Schwerpunkten aus.

Veranstaltungsdaten
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Sponsoring-Unterlage: {sponsorDeckUrl}
Programm: {eventUrl}

Über die Möglichkeit, dies in einem kurzen Gespräch mit Ihnen zu erörtern, würden wir uns sehr freuen.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

DBC Germany UG organise sa MasterClass {eventTitle} le {eventDate} à {eventCity}, dans les locaux de {eventVenue}.

La journée s'adresse aux membres de la diaspora africaine ainsi qu'aux investisseurs DACH qui souhaitent s'engager commercialement sur le continent. Les sessions sont conduites par des entrepreneurs qui dirigent des entreprises performantes en Afrique. Le fil directeur est le suivant : « Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. »

Nous nous permettons de vous écrire afin de vous demander si {organization} envisagerait un partenariat de niveau {pitchTier}. Le dossier joint en présente le contenu – visibilité, présence dans le programme et accès au public – étant entendu que les modalités peuvent être ajustées à vos priorités.

Données de l'événement
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Dossier sponsor : {sponsorDeckUrl}
Programme : {eventUrl}

Nous serions reconnaissants de pouvoir en discuter brièvement avec vous, à votre convenance.

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
  true,
  10
),

-- ----- Press pitch ---------------------------------------------------------
(
  'press_pitch',
  'Press pitch',
  'Formal press accreditation request. Native register in each language; no editorial-team value bullets, just the offer.',
  'press@dbc-germany.com',
  'Press accreditation — {eventTitle} ({eventCity}, {eventDate})',
  'Presseakkreditierung – {eventTitle} ({eventCity}, {eventDate})',
  'Accréditation presse – {eventTitle} ({eventCity}, le {eventDate})',
  $body_en$ {salutation}

DBC Germany UG will hold its MasterClass {eventTitle} on {eventDate} in {eventCity}, at {eventVenue}.

The day brings together members of the African diaspora and DACH investors with entrepreneurs running successful businesses on the continent. Working theme: "Invest in Africa. Structure, secure and capitalise on opportunity." Sessions will address investment strategy, commercial partnerships and market access.

We would be glad to receive {organization} at the event. The press kit contains the speaker list, key data and embargoed materials. We can arrange accreditation, on-site interviews with the keynotes, or an advance briefing — whichever best suits your editorial schedule.

Event details
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Press kit: {pressKitUrl}
Programme: {eventUrl}

Please let us know what would be most useful for your team, and we will take care of the arrangements.

With kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

die DBC Germany UG veranstaltet am {eventDate} in {eventCity} die MasterClass {eventTitle} – in der {eventVenue}.

Der Tag führt Vertreter der afrikanischen Diaspora und DACH-Investoren mit Unternehmern zusammen, die in Afrika erfolgreich operative Geschäfte verantworten. Leitthema: „In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren." Behandelt werden Investitionsstrategie, wirtschaftliche Partnerschaften und Marktzugang.

Wir würden uns freuen, {organization} bei der Veranstaltung begrüßen zu dürfen. Die Pressemappe enthält die Sprecherliste, Eckdaten und Sperrfristmaterialien. Akkreditierung, Vor-Ort-Interviews mit den Keynotes oder ein Vorab-Briefing – wir richten ein, was Ihrem Redaktionsplan am besten entspricht.

Veranstaltungsdaten
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm: {eventUrl}

Bitte teilen Sie uns mit, welche Form der Begleitung für Ihre Redaktion am hilfreichsten wäre; wir kümmern uns um die Vorbereitungen.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

DBC Germany UG organise sa MasterClass {eventTitle} le {eventDate} à {eventCity}, dans les locaux de {eventVenue}.

La journée réunit des membres de la diaspora africaine et des investisseurs DACH avec des entrepreneurs qui dirigent des entreprises performantes sur le continent. Fil directeur : « Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. » Les sessions porteront sur la stratégie d'investissement, les partenariats commerciaux et l'accès au marché.

Nous serions heureux d'accueillir {organization} à l'événement. Le dossier de presse réunit la liste des intervenants, les données clés et les éléments sous embargo. Nous pouvons mettre en place une accréditation, des entretiens sur place avec les intervenants principaux, ou un briefing préalable – selon ce qui convient le mieux à votre planning éditorial.

Données de l'événement
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme : {eventUrl}

N'hésitez pas à nous indiquer la formule qui vous serait la plus utile ; nous nous chargerons des dispositions.

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
  true,
  20
),

-- ----- Speaker pitch -------------------------------------------------------
(
  'speaker_pitch',
  'Speaker pitch',
  'Formal speaking invitation to an entrepreneur running a successful operation on the continent. Native register; "Speaking invitation" / "Sprecher-Einladung" / "Invitation à intervenir".',
  'speakers@dbc-germany.com',
  'Speaking invitation — {eventTitle} ({eventCity}, {eventDate})',
  'Sprecher-Einladung – {eventTitle} ({eventCity}, {eventDate})',
  'Invitation à intervenir – {eventTitle} ({eventCity}, le {eventDate})',
  $body_en$ {salutation}

DBC Germany UG will hold its MasterClass {eventTitle} on {eventDate} in {eventCity}, at {eventVenue}.

The audience comprises members of the African diaspora and DACH investors. Sessions are led by entrepreneurs who run successful businesses on the continent, and it is on that basis that we would like to invite you to speak at the event. The work you lead at {organization} in {sector} is directly relevant to what this audience has come to hear.

The format is yours: a 20-minute keynote, a 35-minute fireside conversation, or a moderated panel — whichever best serves the message you wish to deliver. Travel and accommodation are covered; the honorarium can be discussed directly.

Event details
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

If the invitation is of interest, we will send the slot positioning together with three windows for a brief preparatory call.

With kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

die DBC Germany UG veranstaltet am {eventDate} in {eventCity} die MasterClass {eventTitle} – in der {eventVenue}.

Das Publikum besteht aus Vertretern der afrikanischen Diaspora und DACH-Investoren. Die Sessions werden von Unternehmern geführt, die in Afrika erfolgreich operative Geschäfte verantworten – und auf dieser Grundlage möchten wir Sie bitten, als Sprecher zu der Veranstaltung beizutragen. Die Arbeit, die Sie bei {organization} im Bereich {sector} verantworten, ist genau das, was dieses Publikum hören möchte.

Das Format überlassen wir Ihnen: eine 20-minütige Keynote, ein 35-minütiges Fireside-Gespräch oder ein moderiertes Panel – je nachdem, welches Format Ihrer Botschaft am besten dient. Anreise und Übernachtung übernehmen wir; das Honorar besprechen wir direkt.

Veranstaltungsdaten
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Sofern die Einladung auf Interesse stößt, übermitteln wir Ihnen die Slot-Positionierung sowie drei Terminvorschläge für ein kurzes Vorgespräch.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

DBC Germany UG organise sa MasterClass {eventTitle} le {eventDate} à {eventCity}, dans les locaux de {eventVenue}.

Le public est composé de membres de la diaspora africaine et d'investisseurs DACH. Les sessions sont conduites par des entrepreneurs qui dirigent des entreprises performantes sur le continent – c'est sur cette base que nous souhaiterions vous inviter à intervenir à l'événement. Le travail que vous menez chez {organization} dans {sector} correspond précisément à ce que ce public est venu entendre.

Le format vous revient : une keynote de 20 minutes, un entretien en fireside de 35 minutes ou un panel modéré – selon ce qui sert le mieux votre propos. Le transport et l'hébergement sont à notre charge ; les honoraires se discutent directement.

Données de l'événement
{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Si l'invitation retient votre intérêt, nous vous transmettrons le positionnement du créneau ainsi que trois propositions de date pour un bref échange préparatoire.

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
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
