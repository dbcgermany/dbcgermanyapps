-- =============================================================================
-- 20260516000003  refresh_outreach_templates_copy
-- =============================================================================
-- Round two of the seeded outreach copy:
--   • Adds explicit deep-link lines so the recipient gets clickable URLs to
--     the event page, sponsor deck, press kit — instead of one wall of text.
--     The StaffMessageEmail wrapper auto-linkifies any http(s) URL in the
--     body, so plain-text URLs render as primary-coloured clickable links.
--   • Tightens "Your work at {organization} in {sector}" so the sentence
--     doesn't read as broken when one of those fields is empty for a
--     given contact (interpolator also collapses orphan prepositions
--     defensively; this is the prose-level fallback).
--   • Uses the new {eventUrl} variable (server-resolved per locale).
--
-- Re-runs `ON CONFLICT (slug) DO UPDATE` so this idempotently brings the DB
-- rows back to canonical copy. Admin edits made via /admin/outreach/templates
-- ARE overwritten by this migration — that's intentional for this refresh.
-- Future copy tweaks should go through the admin editor; this migration is
-- a one-off reset to make the first-touch sends presentable.
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
  'First-touch cold pitch to a sponsor prospect. Opens with a sector-tied hook, points to the deck + event page, asks for a 20-minute call.',
  'sponsors@dbc-germany.com',
  'Partnership opportunity — {eventTitle}',
  'Partnerschaftsanfrage — {eventTitle}',
  'Opportunité de partenariat — {eventTitle}',
  $body_en$Hello {firstName},

I'm reaching out because we're building {eventTitle} on {eventDate} in {eventCity} — a one-room conference where senior African and DACH business leaders meet the founders, investors and operators already running businesses across Africa.

Based on what we know about your organisation, we've sketched a {pitchTier}-tier partnership. The deck walks through what that includes (visibility, brand, programme placement) and we can shape it to your goals. Attendee profile, programme and prior-edition outcomes are all in there.

Sponsor pack: {sponsorDeckUrl}
Event details: {eventUrl}

Would you have 20 minutes in the next two weeks for a quick call?

Best,
{senderName}
DBC Germany$body_en$,
  $body_de$Hallo {firstName},

ich melde mich, weil wir {eventTitle} am {eventDate} in {eventCity} aufbauen — eine Konferenz in einem Raum, in der erfahrene afrikanische und DACH-Wirtschaftsentscheider auf Gründer, Investoren und Operator treffen, die bereits in Afrika unternehmerisch tätig sind.

Auf Basis dessen, was wir über Ihre Organisation wissen, haben wir Sie als {pitchTier}-Partner skizziert. Was darin enthalten ist (Sichtbarkeit, Marke, Programm-Platzierung), erklärt das Deck im Detail — wir richten es an Ihren Zielen aus. Teilnehmerprofil, Programm und Ergebnisse der Vor-Edition finden Sie dort.

Sponsor-Deck: {sponsorDeckUrl}
Event-Details: {eventUrl}

Hätten Sie in den nächsten zwei Wochen 20 Minuten für ein kurzes Telefonat?

Beste Grüße
{senderName}
DBC Germany$body_de$,
  $body_fr$Bonjour {firstName},

Je vous contacte parce que nous construisons {eventTitle} le {eventDate} à {eventCity} — une conférence à une salle où décideurs économiques africains et DACH rencontrent les fondateurs, investisseurs et opérateurs déjà actifs en Afrique.

Sur la base de ce que nous savons de votre organisation, nous vous avons positionné comme partenaire {pitchTier}. Le dossier détaille ce que cela inclut (visibilité, marque, positionnement dans le programme) et nous l'adaptons à vos objectifs. Profil des participants, programme et résultats de l'édition précédente y sont.

Dossier sponsor : {sponsorDeckUrl}
Détails de l'événement : {eventUrl}

Auriez-vous 20 minutes dans les deux prochaines semaines pour un rapide échange ?

Cordialement,
{senderName}
DBC Germany$body_fr$,
  true,
  10
),

-- ----- Press pitch ---------------------------------------------------------
(
  'press_pitch',
  'Press pitch',
  'First-touch outreach to a journalist or media outlet. Leads with the editorial hook, points to the press kit + event page, offers accreditation.',
  'press@dbc-germany.com',
  'Story angle — African business leaders convene in {eventCity}, {eventDate}',
  'Pressetermin — afrikanische Wirtschafts-Stimmen in {eventCity}, {eventDate}',
  'Sujet — voix africaines des affaires à {eventCity}, le {eventDate}',
  $body_en$Hello {firstName},

On {eventDate}, {eventCity} hosts {eventTitle} — a single-room conference where senior African and DACH business leaders meet the founders, investors and operators already running businesses across Africa. There's a story angle here I think your readers would care about.

The room will hold roughly 400 attendees. Confirmed keynotes include leadership from senior African ventures and DACH Mittelstand operators. Press kit, speaker shortlist and embargoed materials are linked below.

Press kit: {pressKitUrl}
Event details: {eventUrl}

Happy to arrange accreditation, on-site interviews, or an advance briefing with a keynote — just let me know what works.

Best,
{senderName}
DBC Germany$body_en$,
  $body_de$Hallo {firstName},

am {eventDate} findet in {eventCity} {eventTitle} statt — eine Konferenz in einem Raum, in der erfahrene afrikanische und DACH-Wirtschaftsentscheider auf Gründer, Investoren und Operator mit aktiver Geschäftstätigkeit in Afrika treffen. Hier liegt ein Themenangebot, das für Ihre Leser:innen interessant sein dürfte.

Wir erwarten rund 400 Teilnehmende. Zu den bestätigten Keynotes gehören Spitzenvertreter afrikanischer Unternehmen und DACH-Mittelstands-Operatoren. Pressemappe, Speaker-Übersicht und Sperrfrist-Materialien finden Sie unten verlinkt.

Pressemappe: {pressKitUrl}
Event-Details: {eventUrl}

Akkreditierung, Vor-Ort-Interviews oder ein Vorab-Briefing mit einer Keynote arrangiere ich gerne — sagen Sie mir, was passt.

Beste Grüße
{senderName}
DBC Germany$body_de$,
  $body_fr$Bonjour {firstName},

Le {eventDate}, {eventCity} accueille {eventTitle} — une conférence à une salle où décideurs économiques africains et DACH rencontrent fondateurs, investisseurs et opérateurs déjà actifs en Afrique. Il y a là un angle de sujet qui peut intéresser vos lecteurs.

La salle accueillera environ 400 personnes. Parmi les keynotes confirmées : dirigeants d'entreprises africaines et opérateurs du Mittelstand DACH. Dossier de presse, liste des intervenants et matériaux sous embargo sont liés ci-dessous.

Dossier de presse : {pressKitUrl}
Détails de l'événement : {eventUrl}

Accréditation, interviews sur place ou briefing préalable avec une keynote — dites-moi ce qui convient.

Cordialement,
{senderName}
DBC Germany$body_fr$,
  true,
  20
),

-- ----- Speaker pitch -------------------------------------------------------
(
  'speaker_pitch',
  'Speaker pitch',
  'First-touch invitation to a speaker prospect. Names the slot, audience profile, expected reach + event page link, asks for a yes/no.',
  'speakers@dbc-germany.com',
  'Invitation — speaking slot at {eventTitle}, {eventDate} in {eventCity}',
  'Einladung — Speaking-Slot bei {eventTitle}, {eventDate} in {eventCity}',
  'Invitation — intervention à {eventTitle}, le {eventDate} à {eventCity}',
  $body_en$Hello {firstName},

I'd like to invite you to speak at {eventTitle} on {eventDate} in {eventCity}. The room is one stage, roughly 400 senior attendees — African and DACH business leaders, founders, investors and operators already running businesses across Africa.

Format is flexible: 20-minute keynote, 35-minute fireside, or a moderated panel. We cover travel + accommodation; honoraria depend on the slot and we're happy to discuss directly.

Programme + audience profile: {eventUrl}

Would this be a yes in principle? If so, I'll send the programme positioning and three candidate dates for a quick prep call.

Best,
{senderName}
DBC Germany$body_en$,
  $body_de$Hallo {firstName},

ich möchte Sie als Sprecher:in zu {eventTitle} am {eventDate} in {eventCity} einladen. Eine Bühne, rund 400 hochrangige Teilnehmende — afrikanische und DACH-Wirtschaftsentscheider, Gründer, Investoren und Operator mit aktiver Geschäftstätigkeit in Afrika.

Das Format ist flexibel: 20-minütige Keynote, 35-minütiger Fireside-Talk oder ein moderiertes Panel. Wir übernehmen Reise + Unterkunft; Honorare hängen vom Slot ab und wir besprechen das gerne direkt.

Programm + Publikumsprofil: {eventUrl}

Wäre das grundsätzlich ein Ja? Falls ja, schicke ich Ihnen die Programm-Positionierung und drei Terminvorschläge für ein kurzes Vorgespräch.

Beste Grüße
{senderName}
DBC Germany$body_de$,
  $body_fr$Bonjour {firstName},

J'aimerais vous inviter à intervenir à {eventTitle}, le {eventDate} à {eventCity}. Une seule scène, environ 400 participants de haut niveau — décideurs économiques africains et DACH, fondateurs, investisseurs et opérateurs déjà actifs en Afrique.

Le format est flexible : keynote de 20 minutes, fireside de 35 minutes ou panel modéré. Nous prenons en charge transport et hébergement ; les honoraires dépendent du créneau et nous en discutons directement.

Programme + profil du public : {eventUrl}

Serait-ce un oui de principe ? Si oui, je vous envoie le positionnement programme et trois propositions de date pour un rapide échange préparatoire.

Cordialement,
{senderName}
DBC Germany$body_fr$,
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
