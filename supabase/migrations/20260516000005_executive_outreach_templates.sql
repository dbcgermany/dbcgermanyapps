-- =============================================================================
-- 20260516000005  executive_outreach_templates
-- =============================================================================
-- Final cold first-touch copy, senior-executive register. Replaces the
-- "humanised" v3 (20260516000004), which read like advertising — opening
-- lines like "Quick one." and "Worth 20 minutes next week to see if it fits?"
-- did not match what a sales lead or programme director would actually write
-- to a managing director, an editor-in-chief, or a sitting C-level speaker.
--
-- Positioning:
--   • The event is a MasterClass for the African diaspora and DACH/European
--     investors looking at Africa.
--   • Speakers are real entrepreneurs running successful operating companies
--     on the continent.
--   • The leitgedanke „In Afrika investieren. Strukturieren, absichern und
--     Chancen rentabilisieren." appears in every body, translated cleanly
--     into EN and FR (the FR uses the direct cognate rentabiliser).
--
-- Structure for every template (mirroring the gold-standard press example):
--   1. {salutation},                       — formal Herr/Frau/Dr./Prof. or fallback
--   2. one-line strategic hook
--   3. identity sentence: "DBC Germany UG …" with MasterClass framing
--   4. „Leitgedanke" quoted block, locale-correct quotation marks
--   5. who's in the room
--   6. tier/ask paragraph (only sponsor) or value bullets (press/speaker)
--   7. bulleted offer list
--   8. stacked event-details block (title / date / time / venue / address)
--   9. links (sponsor pack / press kit / programme)
--  10. forward-looking ask
--  11. Mit freundlichen Grüßen / With kind regards / Cordialement
--  12. {senderName}\nDBC Germany UG
--
-- New variables in use (added in the same release):
--   {salutation}  {eventTime}  {eventAddress}  + {eventDate} now includes
--   the weekday (DE "Samstag, 13. Juni 2026", EN "Saturday, June 13, 2026",
--   FR "samedi 13 juin 2026").
--
-- Re-runs ON CONFLICT (slug) DO UPDATE — admin edits made via
-- /admin/outreach/templates ARE overwritten by this migration. Future
-- tweaks should be made via the editor, not new migrations.
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
  'Cold first-touch to a sponsor prospect. Senior-executive register: leitgedanke, MasterClass framing, tier proposal, stacked event-details block.',
  'sponsors@dbc-germany.com',
  'Partnership opportunity at {eventTitle} — {eventCity}, {eventDate}',
  'Partnerschaftsgespräch zu {eventTitle} — {eventCity}, {eventDate}',
  'Partenariat à {eventTitle} — {eventCity}, le {eventDate}',
  $body_en$ {salutation}

Africa is one of the most dynamic economic regions of the coming decade. Against this backdrop, DBC Germany UG is convening {eventTitle} on {eventDate} in {eventCity} — a MasterClass that brings together the African diaspora and decision-makers from the DACH region with entrepreneurs who run successful operating companies on the continent.

Under the guiding theme

"Invest in Africa. Structure, secure and capitalise on opportunity."

we will assemble approximately 400 senior participants in one room: investors, executives and members of the African diaspora — alongside DACH operators with active interests on the continent.

In that context, we would like to propose to {organization} a partnership at the {pitchTier} tier. Such a partnership includes, among other elements:

•  prominent visibility within the programme and on all event materials
•  strategically positioned speaking opportunities before a qualified decision-maker audience
•  exclusive networking formats with African entrepreneurs and DACH operators
•  priority access to speaker briefings and the delegation track
•  coordinated co-branding within the media coverage of the event

The precise arrangement can be shaped around the priorities of {organization} for the year.

Event details

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Sponsor pack: {sponsorDeckUrl}
Programme: {eventUrl}

I would welcome the opportunity of a personal conversation to explore how a partnership could be meaningfully structured.

With kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

Afrika gehört zu den dynamischsten Wirtschaftsräumen der kommenden Dekade. Vor diesem Hintergrund richtet die DBC Germany UG am {eventDate} in {eventCity} {eventTitle} aus — eine MasterClass, die die afrikanische Diaspora und Entscheidungsträger aus dem DACH-Raum mit Unternehmern zusammenbringt, die in Afrika erfolgreich operative Unternehmen führen.

Unter dem Leitgedanken

„In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren."

versammeln wir rund 400 hochrangige Teilnehmer in einem Saal: Investoren, Führungskräfte und Vertreter der afrikanischen Diaspora — sowie DACH-Operatoren mit aktiven Engagements auf dem Kontinent.

In diesem Rahmen möchten wir {organization} eine Partnerschaft auf {pitchTier}-Niveau vorschlagen. Eine solche Partnerschaft umfasst unter anderem:

•  prominente Sichtbarkeit im Programm und auf allen Veranstaltungsmaterialien
•  strategisch platzierte Auftrittsmöglichkeiten vor einem qualifizierten Entscheiderkreis
•  exklusive Networking-Formate mit afrikanischen Unternehmern und DACH-Operatoren
•  vorpriorisierter Zugang zu Speaker-Briefings und zur Delegationsebene
•  abgestimmtes Co-Branding in der medialen Begleitung des Events

Die genaue Ausgestaltung lässt sich an den Prioritäten von {organization} für das Jahr ausrichten.

Veranstaltungsdetails

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Sponsorenmappe: {sponsorDeckUrl}
Programm: {eventUrl}

Wir würden uns freuen, mit Ihnen in einem persönlichen Gespräch zu prüfen, wie sich eine Partnerschaft sinnvoll gestalten lässt.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

L'Afrique compte parmi les espaces économiques les plus dynamiques de la décennie à venir. C'est dans ce contexte que DBC Germany UG organise {eventTitle}, le {eventDate} à {eventCity} — une MasterClass qui réunit la diaspora africaine et les décideurs de la région DACH avec des entrepreneurs qui dirigent des entreprises opérationnelles à succès sur le continent.

Sous le mot d'ordre

« Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. »

nous rassemblerons environ 400 participants de haut niveau dans une même salle : investisseurs, dirigeants et membres de la diaspora africaine — ainsi qu'opérateurs DACH engagés sur le continent.

Dans cette perspective, nous souhaitons proposer à {organization} un partenariat de niveau {pitchTier}. Un tel partenariat comprend notamment :

•  une visibilité forte dans le programme et sur l'ensemble des supports de l'événement
•  des prises de parole positionnées stratégiquement devant un public qualifié de décideurs
•  des formats exclusifs de networking avec des entrepreneurs africains et opérateurs DACH
•  un accès prioritaire aux briefings des intervenants et au niveau délégation
•  un co-branding coordonné dans la couverture médiatique de l'événement

Les modalités précises peuvent être ajustées aux priorités de {organization} pour l'année.

Détails de l'événement

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Dossier sponsor : {sponsorDeckUrl}
Programme : {eventUrl}

Je serais heureux d'échanger personnellement avec vous afin d'évaluer comment ce partenariat peut être construit utilement.

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
  'Cold first-touch to a journalist. Senior-executive register: leitgedanke, MasterClass framing, editorial-team value bullets, stacked event-details block, accreditation/interview/embargo offer.',
  'press@dbc-germany.com',
  'Press accreditation — {eventTitle}, {eventDate} in {eventCity}',
  'Presseakkreditierung — {eventTitle}, {eventDate} in {eventCity}',
  'Accréditation presse — {eventTitle}, le {eventDate} à {eventCity}',
  $body_en$ {salutation}

Africa is one of the most dynamic economic regions of the coming decade — and that is precisely where {eventTitle} positions itself, on {eventDate} in {eventCity}.

DBC Germany UG would like to invite you to cover this international business forum. Conceived as a MasterClass, it brings together the African diaspora and decision-makers from the DACH region with entrepreneurs who run successful operating companies on the continent.

Under the guiding theme

"Invest in Africa. Structure, secure and capitalise on opportunity."

the day will centre on current investment opportunities, commercial partnerships and the future markets of the African continent.

For your editorial team, this represents:

•  exclusive insight into German-African commercial cooperation
•  interview opportunities with African entrepreneurs and international speakers
•  access to high-level networking formats
•  substantive content on investment, innovation and market-relevant developments
•  strong visual and journalistic storytelling moments

Event details

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Press kit: {pressKitUrl}
Programme: {eventUrl}

I would be pleased to arrange accreditation, on-site interviews with the keynote speakers, or an advance briefing under embargo — whichever best fits your editorial calendar.

With kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

Afrika zählt zu den dynamischsten Wirtschaftsräumen der kommenden Dekade — und genau hier setzt {eventTitle} an, das am {eventDate} in {eventCity} stattfindet.

Die DBC Germany UG lädt Sie ein, dieses internationale Business-Forum journalistisch zu begleiten. Als MasterClass führt es die afrikanische Diaspora und Entscheidungsträger aus dem DACH-Raum mit Unternehmern zusammen, die in Afrika erfolgreich operative Unternehmen führen.

Unter dem Leitgedanken

„In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren."

stehen aktuelle Investitionsmöglichkeiten, wirtschaftliche Partnerschaften sowie die Zukunftsmärkte des afrikanischen Kontinents im Mittelpunkt.

Für Ihre Redaktion ergeben sich daraus:

•  exklusive Einblicke in deutsch-afrikanische Wirtschaftskooperationen
•  Interviewmöglichkeiten mit afrikanischen Unternehmern und internationalen Speakern
•  Zugang zu hochrangigen Networking-Formaten
•  fundierte Inhalte zu Investitionen, Innovation und marktrelevanten Entwicklungen
•  belastbare visuelle und journalistische Erzählmomente

Veranstaltungsdetails

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm: {eventUrl}

Gerne richte ich Ihnen Akkreditierung, Vor-Ort-Interviews mit den Keynotes oder ein vertrauliches Vorab-Briefing ein — je nachdem, was Ihrem Redaktionsplan am besten entspricht.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

L'Afrique compte parmi les espaces économiques les plus dynamiques de la décennie à venir — et c'est précisément le positionnement de {eventTitle}, qui se tiendra le {eventDate} à {eventCity}.

DBC Germany UG vous invite à couvrir ce forum business international. Conçu comme une MasterClass, il réunit la diaspora africaine et les décideurs de la région DACH avec des entrepreneurs qui dirigent des entreprises opérationnelles à succès sur le continent.

Sous le mot d'ordre

« Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. »

la journée mettra au centre les opportunités d'investissement actuelles, les partenariats commerciaux et les marchés d'avenir du continent africain.

Pour votre rédaction, cela représente :

•  un accès exclusif aux coopérations économiques germano-africaines
•  des possibilités d'interview avec des entrepreneurs africains et intervenants internationaux
•  l'accès à des formats de networking de haut niveau
•  des contenus de fond sur l'investissement, l'innovation et les développements de marché
•  des moments forts pour la narration visuelle et journalistique

Détails de l'événement

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme : {eventUrl}

Je me tiens à votre disposition pour organiser une accréditation, des entretiens sur place avec les intervenants principaux ou un briefing préalable sous embargo — selon ce qui convient le mieux à votre calendrier éditorial.

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
  'Cold first-touch to a speaker prospect (entrepreneur running a successful operating company on the continent). Senior-executive register: leitgedanke, MasterClass framing, format options, stacked event-details block.',
  'speakers@dbc-germany.com',
  'Invitation to address {eventTitle} — {eventCity}, {eventDate}',
  'Einladung zur Rede bei {eventTitle} — {eventCity}, {eventDate}',
  'Invitation à intervenir à {eventTitle} — {eventCity}, le {eventDate}',
  $body_en$ {salutation}

It would be a particular privilege to invite you to address {eventTitle}, held on {eventDate} in {eventCity}.

DBC Germany UG is convening a MasterClass that brings together the African diaspora and decision-makers from the DACH region with entrepreneurs who run successful operating companies on the continent. It is precisely into this circle that we would like to invite you.

Under the guiding theme

"Invest in Africa. Structure, secure and capitalise on opportunity."

the focus will rest on investment strategy, commercial partnerships and the future markets of the continent. The work you lead at {organization} in {sector} is exactly what this audience has come to hear: substantive experience from a genuinely successful operation on the continent.

We can offer:

•  a 20-minute keynote on the main stage
•  a 35-minute fireside with moderated Q&A
•  or a moderated panel on a topic of your choosing

Travel and accommodation are taken care of; the honorarium will be discussed in conversation.

Event details

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Programme and audience profile: {eventUrl}

Should the principle be of interest, I will follow up with the proposed slot positioning and three windows for a preparatory call.

With kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

es wäre uns eine besondere Ehre, Sie als Redner zu {eventTitle} einzuladen, das am {eventDate} in {eventCity} stattfindet.

Die DBC Germany UG richtet eine MasterClass aus, die die afrikanische Diaspora und Entscheidungsträger aus dem DACH-Raum mit Unternehmern zusammenbringt, die in Afrika erfolgreich operative Unternehmen führen. Genau in diese Reihe möchten wir Sie einladen.

Unter dem Leitgedanken

„In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren."

werden Investitionsstrategien, wirtschaftliche Partnerschaften und Zukunftsmärkte des Kontinents im Mittelpunkt stehen. Die Arbeit, die Sie bei {organization} im Bereich {sector} verantworten, ist genau das, was dieses Publikum hören möchte: belastbare Erfahrung aus einem tatsächlich erfolgreich geführten Geschäft auf dem Kontinent.

Wir können Ihnen folgende Formate anbieten:

•  eine 20-minütige Keynote auf der Hauptbühne
•  einen 35-minütigen Fireside-Talk mit moderiertem Q&A
•  oder ein moderiertes Panel zu einem von Ihnen gesetzten Schwerpunkt

Anreise und Übernachtung übernehmen wir; das Honorar besprechen wir im persönlichen Gespräch.

Veranstaltungsdetails

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Programm und Publikumsprofil: {eventUrl}

Sofern grundsätzliches Interesse besteht, übermittle ich Ihnen die Slot-Positionierung sowie drei Terminvorschläge für ein Vorgespräch.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

Ce serait un honneur particulier de vous inviter à prendre la parole à {eventTitle}, le {eventDate} à {eventCity}.

DBC Germany UG organise une MasterClass qui réunit la diaspora africaine et les décideurs de la région DACH avec des entrepreneurs qui dirigent des entreprises opérationnelles à succès sur le continent. C'est précisément à ce cercle que nous souhaitons vous associer.

Sous le mot d'ordre

« Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. »

l'accent sera mis sur la stratégie d'investissement, les partenariats commerciaux et les marchés d'avenir du continent. Le travail que vous menez chez {organization} dans {sector} correspond précisément à ce que ce public est venu écouter : une expérience solide tirée d'une entreprise réellement performante sur le continent.

Nous pouvons vous proposer :

•  une keynote de 20 minutes sur la scène principale
•  un fireside de 35 minutes avec questions-réponses modérées
•  ou un panel modéré sur un sujet que vous aurez choisi

Le transport et l'hébergement sont à notre charge ; les honoraires se discutent de vive voix.

Détails de l'événement

{eventTitle}
{eventDate}
{eventTime}
{eventVenue}
{eventAddress}

Programme et profil du public : {eventUrl}

Si le principe vous agrée, je vous transmettrai le positionnement du créneau ainsi que trois propositions de date pour un échange préparatoire.

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
