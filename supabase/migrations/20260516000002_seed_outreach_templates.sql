-- =============================================================================
-- 20260516000002  seed_outreach_templates
-- =============================================================================
-- Seeds the three first-touch cold-outreach pitches the admin compose dialog
-- offers out of the box: sponsor / press / speaker.
--
-- Each row carries subject + body per locale with `{variable}` placeholders
-- the server interpolates at fetch-time from contact + event + sender data.
-- See apps/admin/src/actions/outreach-templates.ts for the variable list.
--
-- Idempotent — ON CONFLICT (slug) DO UPDATE so re-running keeps subject /
-- body in sync with this file's canonical copy. To tweak wording in
-- production, edit via /admin/outreach/templates/<slug> (writes the same
-- row); this seed only resets if the admin hasn't customized.
--
-- Body strings use dollar-quoting ($body$…$body$) so apostrophes + newlines
-- need no escaping.
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
  'First-touch cold pitch to a sponsor prospect. Opens with a sector-tied hook, points to the deck, asks for a 20-minute call.',
  'sponsors@dbc-germany.com',
  'Partnership opportunity — {eventTitle}',
  'Partnerschaftsanfrage — {eventTitle}',
  'Opportunité de partenariat — {eventTitle}',
  $body_en$Hello {firstName},

I'm reaching out because {organization} is the kind of partner that fits what we're building around {eventTitle} on {eventDate} in {eventCity}: a one-room conference where senior African and DACH business leaders meet the founders, investors and operators already running businesses across Africa.

We've mapped you to a {pitchTier}-tier partnership — the deck explains what that includes in detail, and we can shape it to your goals. The attendee profile, programme and prior-edition outcomes are all in there: {sponsorDeckUrl}.

Would you have 20 minutes in the next two weeks for a quick call?

Best,
{senderName}
DBC Germany$body_en$,
  $body_de$Hallo {firstName},

ich melde mich, weil {organization} zu der Art von Partnern gehört, die wir für {eventTitle} am {eventDate} in {eventCity} suchen: eine Konferenz in einem Raum, in der erfahrene afrikanische und DACH-Wirtschaftsentscheider auf Gründer, Investoren und Operator treffen, die bereits in Afrika unternehmerisch tätig sind.

Wir haben Sie als {pitchTier}-Partner eingeordnet — was darin enthalten ist, erklärt das Deck im Detail, und wir richten es an Ihren Zielen aus. Teilnehmerprofil, Programm und Ergebnisse der Vor-Edition finden Sie hier: {sponsorDeckUrl}.

Hätten Sie in den nächsten zwei Wochen 20 Minuten für ein kurzes Telefonat?

Beste Grüße
{senderName}
DBC Germany$body_de$,
  $body_fr$Bonjour {firstName},

Je vous contacte parce que {organization} correspond au type de partenaire que nous recherchons autour de {eventTitle}, le {eventDate} à {eventCity} : une conférence à une salle où des décideurs économiques africains et DACH rencontrent les fondateurs, investisseurs et opérateurs qui opèrent déjà en Afrique.

Nous vous avons positionné comme partenaire {pitchTier} — le dossier détaille ce que cela inclut et nous l'adaptons à vos objectifs. Profil des participants, programme et résultats de l'édition précédente y sont : {sponsorDeckUrl}.

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
  'First-touch outreach to a journalist or media outlet. Leads with the editorial hook, points to the press kit, offers accreditation.',
  'press@dbc-germany.com',
  'Story angle — African business leaders convene in {eventCity}, {eventDate}',
  'Pressetermin — afrikanische Wirtschafts-Stimmen in {eventCity}, {eventDate}',
  'Sujet — voix africaines des affaires à {eventCity}, le {eventDate}',
  $body_en$Hello {firstName},

On {eventDate}, {eventCity} hosts {eventTitle} — a single-room conference where senior African and DACH business leaders meet the founders, investors and operators already running businesses across Africa. Given {organization}'s coverage of {sector}, I think there's a story angle worth your time.

The room will hold roughly 400 attendees. Confirmed keynotes include leadership from senior African ventures and DACH Mittelstand operators. Press kit, speaker shortlist and embargoed materials are here: {pressKitUrl}.

Happy to arrange accreditation, on-site interviews, or an advance briefing with a keynote — just let me know what works.

Best,
{senderName}
DBC Germany$body_en$,
  $body_de$Hallo {firstName},

am {eventDate} findet in {eventCity} {eventTitle} statt — eine Konferenz in einem Raum, in der erfahrene afrikanische und DACH-Wirtschaftsentscheider auf Gründer, Investoren und Operator mit aktiver Geschäftstätigkeit in Afrika treffen. Angesichts der Berichterstattung von {organization} zu {sector} sehe ich hier ein interessantes Themenangebot.

Wir erwarten rund 400 Teilnehmende. Zu den bestätigten Keynotes gehören Spitzenvertreter afrikanischer Unternehmen und DACH-Mittelstands-Operatoren. Pressemappe, Speaker-Übersicht und Sperrfrist-Materialien finden Sie hier: {pressKitUrl}.

Akkreditierung, Vor-Ort-Interviews oder ein Vorab-Briefing mit einer Keynote arrangiere ich gerne — sagen Sie mir, was passt.

Beste Grüße
{senderName}
DBC Germany$body_de$,
  $body_fr$Bonjour {firstName},

Le {eventDate}, {eventCity} accueille {eventTitle} — une conférence à une salle où décideurs économiques africains et DACH rencontrent fondateurs, investisseurs et opérateurs déjà actifs en Afrique. Vu la couverture de {organization} sur {sector}, il y a là un angle de sujet qui peut vous intéresser.

La salle accueillera environ 400 personnes. Parmi les keynotes confirmées : dirigeants d'entreprises africaines et opérateurs du Mittelstand DACH. Dossier de presse, liste des intervenants et matériaux sous embargo : {pressKitUrl}.

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
  'First-touch invitation to a speaker prospect. Names the slot, audience profile, expected reach, and asks for a yes/no.',
  'speakers@dbc-germany.com',
  'Invitation — speaking slot at {eventTitle}, {eventDate} in {eventCity}',
  'Einladung — Speaking-Slot bei {eventTitle}, {eventDate} in {eventCity}',
  'Invitation — intervention à {eventTitle}, le {eventDate} à {eventCity}',
  $body_en$Hello {firstName},

I'd like to invite you to speak at {eventTitle} on {eventDate} in {eventCity}. The room is one stage, roughly 400 senior attendees — African and DACH business leaders, founders, investors and operators already running businesses across Africa. Your work at {organization} in {sector} fits exactly what this audience comes for.

Format is flexible: 20-minute keynote, 35-minute fireside, or a moderated panel. We cover travel + accommodation; honoraria depend on the slot and we're happy to discuss directly.

Would this be a yes in principle? If so, I'll send the programme positioning and three candidate dates for a quick prep call.

Best,
{senderName}
DBC Germany$body_en$,
  $body_de$Hallo {firstName},

ich möchte Sie als Sprecher:in zu {eventTitle} am {eventDate} in {eventCity} einladen. Eine Bühne, rund 400 hochrangige Teilnehmende — afrikanische und DACH-Wirtschaftsentscheider, Gründer, Investoren und Operator mit aktiver Geschäftstätigkeit in Afrika. Ihre Arbeit bei {organization} in {sector} passt genau zu dem, wofür dieses Publikum kommt.

Das Format ist flexibel: 20-minütige Keynote, 35-minütiger Fireside-Talk oder ein moderiertes Panel. Wir übernehmen Reise + Unterkunft; Honorare hängen vom Slot ab und wir besprechen das gerne direkt.

Wäre das grundsätzlich ein Ja? Falls ja, schicke ich Ihnen die Programm-Positionierung und drei Terminvorschläge für ein kurzes Vorgespräch.

Beste Grüße
{senderName}
DBC Germany$body_de$,
  $body_fr$Bonjour {firstName},

J'aimerais vous inviter à intervenir à {eventTitle}, le {eventDate} à {eventCity}. Une seule scène, environ 400 participants de haut niveau — décideurs économiques africains et DACH, fondateurs, investisseurs et opérateurs déjà actifs en Afrique. Votre travail chez {organization} dans {sector} correspond exactement à ce que ce public vient chercher.

Le format est flexible : keynote de 20 minutes, fireside de 35 minutes ou panel modéré. Nous prenons en charge transport et hébergement ; les honoraires dépendent du créneau et nous en discutons directement.

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
