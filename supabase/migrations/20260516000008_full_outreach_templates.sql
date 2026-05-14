-- =============================================================================
-- 20260516000008  full_outreach_templates
-- =============================================================================
-- Expands the outreach template set from 3 → 9 and rewrites the 3 existing
-- bodies to match the user-authored PDF email pack
-- (richesses-dafrique-essen-outreach-emails.pdf). Every body now carries the
-- same credibility scaffolding: Paris Palais des Sports May 2025 (1,500+
-- participants under the patronage of Elisabeth Moreno, Chairwoman of Ring
-- Capital and Ring Africa), Dakar Théâtre National Daniel Sorano (March 2026),
-- Libreville (August 2025), and references DBC's founder Dr. Jean-Clément
-- Diambilay (founded 2023).
--
-- Audiences:
--   sponsor_pitch          (sort 10) reply→ sponsors@dbc-germany.com
--   press_pitch            (sort 20) reply→ press@dbc-germany.com
--   speaker_pitch          (sort 30) reply→ speakers@dbc-germany.com
--   institutional_bodies   (sort 40) reply→ sponsors@dbc-germany.com
--   chambers_of_commerce   (sort 50) reply→ sponsors@dbc-germany.com
--   investors              (sort 60) reply→ sponsors@dbc-germany.com
--   diaspora_associations  (sort 70) reply→ info@dbc-germany.com
--   corporates             (sort 80) reply→ sponsors@dbc-germany.com
--   vips_and_protocol      (sort 90) reply→ info@dbc-germany.com
--
-- Operator-fill literal placeholders kept as `[...]` (NOT `{...}` — won't be
-- interpolated): [PERSONALISE — …] (speaker), [DATE] (speaker deadline),
-- [Phone] (selected signatures).
--
-- Leitgedanke (locked, all locales):
--   DE „In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren."
--   EN "Invest in Africa. Structure, secure and capitalise on opportunity."
--   FR « Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. »
--
-- Re-runs ON CONFLICT (slug) DO UPDATE — admin edits made via the editor at
-- /admin/outreach/templates ARE overwritten by this migration. Future tweaks
-- belong in the editor, not new migrations.
-- =============================================================================

INSERT INTO public.outreach_templates (
  slug, name, description, reply_to,
  subject_en, subject_de, subject_fr,
  body_en, body_de, body_fr,
  is_system, sort_order
) VALUES

-- =====================  01. Sponsor pitch  =====================
(
  'sponsor_pitch',
  'Sponsor pitch',
  'Partnership opportunity to a sponsor prospect — full credibility scaffolding (Paris/Dakar/Libreville), three-audience composition, tier proposal.',
  'sponsors@dbc-germany.com',
  'Partnership opportunity — {eventTitle}, {eventDate}',
  'Partnerschaftsgespräch – {eventTitle}, {eventDate}',
  'Proposition de partenariat – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

On {eventDate}, DBC Germany UG hosts {eventTitle} at {eventVenue} — the first German edition of a format that filled the Palais des Sports in Paris with more than 1,500 participants in May 2025 and has since travelled to Dakar (Théâtre National Daniel Sorano, March 2026) and Libreville (August 2025).

Richesses d'Afrique is the flagship programme of the Diambilay Business Center, the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. The Paris edition was patronised by Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Across every edition, the rule is the same: speakers are operators who have built and scaled real companies in Africa — not commentators.

The Essen edition is purpose-built for the DACH–Africa corridor. It brings three audiences into one room:

•  Founders and operators running profitable businesses on the continent
•  DACH investors, family offices and corporates evaluating market entry into Africa
•  Members of the African and Congolese diaspora in Germany ready to deploy capital, skills and networks

Working theme: "Invest in Africa. Structure, secure and capitalise on opportunity." The programme covers sector strategy (agribusiness, energy, digital), legal and tax structuring across jurisdictions, partner due diligence and access to financing — the questions that decide whether an African investment actually performs.

We are now finalising our partner roster. Sponsorship is structured in tiers, each with distinct exposure to the room and to our cross-border media reach across French, German, English and African press. For {organization}, we would propose the {pitchTier} tier. I would be glad to send you the partnership deck and walk you through which elements fit your objectives. A twenty-minute call next week would be enough to map this out.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Press kit: {pressKitUrl}
Programme and tickets: {eventUrl}

Kind regards,

{senderName}
DBC Germany UG
Düsseldorf $body_en$,
  $body_de$ {salutation}

am {eventDate} richtet die DBC Germany UG {eventTitle} in {eventVenue} aus — die erste deutsche Ausgabe eines Formats, das im Mai 2025 das Palais des Sports in Paris mit mehr als 1.500 Teilnehmern füllte und seither in Dakar (Théâtre National Daniel Sorano, März 2026) sowie in Libreville (August 2025) gastierte.

Richesses d'Afrique ist das Flagship-Programm des Diambilay Business Center, des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Die Pariser Ausgabe stand unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. In jeder Ausgabe gilt dieselbe Regel: Sprecher sind Unternehmer, die in Afrika reale Geschäfte aufgebaut und skaliert haben — keine Kommentatoren.

Die Essener Ausgabe ist eigens für den DACH–Afrika-Korridor konzipiert. Sie bringt drei Zielgruppen in einen Saal:

•  Gründer und Unternehmer, die profitable Geschäfte auf dem Kontinent betreiben
•  DACH-Investoren, Family Offices und Konzerne, die einen Markteintritt in Afrika prüfen
•  Vertreter der afrikanischen und kongolesischen Diaspora in Deutschland, die bereit sind, Kapital, Kompetenzen und Netzwerke einzusetzen

Leitthema: „In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren." Im Mittelpunkt stehen Sektorstrategie (Agrar, Energie, Digital), rechtliche und steuerliche Strukturierung über Jurisdiktionen hinweg, Partner-Due-Diligence sowie Zugang zu Finanzierung — die Fragen, die darüber entscheiden, ob ein Afrika-Engagement tatsächlich performt.

Wir finalisieren derzeit unser Partner-Roster. Sponsoring ist in Stufen strukturiert, jede mit klar abgegrenzter Sichtbarkeit im Saal sowie in unserer grenzüberschreitenden Medienreichweite über französische, deutsche, englische und afrikanische Presse. Für {organization} würden wir die Stufe {pitchTier} vorschlagen. Gerne lassen wir Ihnen die Partnerschaftsunterlage zukommen und erläutern, welche Elemente zu Ihren Zielen passen. Ein zwanzigminütiges Gespräch in der kommenden Woche würde genügen, dies zu skizzieren.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm und Tickets: {eventUrl}

Mit freundlichen Grüßen

{senderName}
DBC Germany UG
Düsseldorf $body_de$,
  $body_fr$ {salutation}

Le {eventDate}, DBC Germany UG accueille {eventTitle} à {eventVenue} — première édition allemande d'un format qui a rempli le Palais des Sports à Paris en mai 2025 avec plus de 1 500 participants, et qui s'est ensuite tenu à Dakar (Théâtre National Daniel Sorano, mars 2026) ainsi qu'à Libreville (août 2025).

Richesses d'Afrique est le programme phare du Diambilay Business Center, incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. L'édition parisienne s'est tenue sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Pour chaque édition, la règle est la même : les intervenants sont des opérateurs qui ont bâti et fait croître de véritables entreprises en Afrique — non des commentateurs.

L'édition d'Essen est conçue spécifiquement pour le corridor DACH–Afrique. Elle réunit trois publics dans une même salle :

•  Fondateurs et dirigeants d'entreprises rentables sur le continent
•  Investisseurs DACH, family offices et grands groupes qui évaluent une entrée sur les marchés africains
•  Membres de la diaspora africaine et congolaise en Allemagne, prêts à déployer capital, compétences et réseaux

Fil directeur : « Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. » Le programme couvre la stratégie sectorielle (agro-industrie, énergie, numérique), la structuration juridique et fiscale entre juridictions, la due diligence des partenaires et l'accès au financement — les questions qui déterminent réellement la performance d'un investissement africain.

Nous finalisons actuellement notre liste de partenaires. Le sponsoring est structuré en niveaux, chacun bénéficiant d'une exposition distincte dans la salle ainsi que dans notre couverture médiatique transfrontalière (presse française, allemande, anglaise et africaine). Pour {organization}, nous proposerions le niveau {pitchTier}. Je serais heureux de vous adresser le dossier de partenariat et d'en parcourir avec vous les éléments qui correspondent à vos objectifs. Un échange de vingt minutes la semaine prochaine suffirait à le préciser.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme et billets : {eventUrl}

Cordialement,

{senderName}
DBC Germany UG
Düsseldorf $body_fr$,
  true, 10
),

-- =====================  02. Press pitch  =====================
(
  'press_pitch',
  'Press pitch',
  'Press accreditation request — credibility paragraph, editorial angle, four-format offer (accreditation/interviews/embargo kit/briefing).',
  'press@dbc-germany.com',
  'First German edition of Richesses d''Afrique — {eventCity}, {eventDate}',
  'Erste deutsche Ausgabe von Richesses d''Afrique – {eventCity}, {eventDate}',
  'Première édition allemande de Richesses d''Afrique – {eventCity}, le {eventDate}',
  $body_en$ {salutation}

On {eventDate}, the Diambilay Business Center brings its Richesses d'Afrique masterclass to Germany for the first time. The day-long programme runs at {eventVenue} and is open to accredited press.

Why this matters for your readers: DBC, founded in 2023 by Dr. Jean-Clément Diambilay, has become one of the most visible platforms connecting African operators with international investors. The Paris edition (May 2025, Palais des Sports) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (March 2026) and Libreville (August 2025) followed, with sustained coverage from Agence Ecofin, APA News and Pan-African broadcasters. Essen is the first chapter in the DACH region.

The angle: a Pan-African incubator opens a permanent corridor between the German-speaking economy and operational businesses on the continent — at a moment when Germany is actively rethinking its Africa strategy. The speaker line-up is composed of African and European founders who run companies in Africa, not analysts. The masterclass format is built for substance, not pageantry.

For your desk, we can offer:

•  Full press accreditation and access to the press conference
•  One-on-one interviews with Dr. Diambilay and selected speakers (slots reserved seven days in advance)
•  Embargoed press kit with speaker bios, sector data and high-resolution visuals
•  A pre-event phone or video briefing on your timetable

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Press kit: {pressKitUrl}
Programme: {eventUrl}

Tell me what works best for your editorial schedule and I will arrange it.

Kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

am {eventDate} bringt das Diambilay Business Center seine Richesses d'Afrique Masterclass zum ersten Mal nach Deutschland. Das ganztägige Programm findet in der {eventVenue} statt und ist für akkreditierte Pressevertreter geöffnet.

Warum dies für Ihre Leserschaft relevant ist: DBC, 2023 von Dr. Jean-Clément Diambilay gegründet, hat sich zu einer der sichtbarsten Plattformen entwickelt, die afrikanische Unternehmer mit internationalen Investoren verbindet. Die Pariser Ausgabe (Mai 2025, Palais des Sports) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (März 2026) und Libreville (August 2025) folgten, mit anhaltender Berichterstattung von Agence Ecofin, APA News und panafrikanischen Rundfunkanstalten. Essen ist das erste Kapitel im DACH-Raum.

Der Angle: Ein panafrikanischer Inkubator öffnet einen dauerhaften Korridor zwischen der deutschsprachigen Wirtschaft und operativen Unternehmen auf dem Kontinent — in einem Moment, in dem Deutschland seine Afrika-Strategie aktiv neu denkt. Das Sprecher-Line-up besteht aus afrikanischen und europäischen Gründern, die in Afrika Unternehmen führen, nicht aus Analysten. Das Masterclass-Format ist auf Substanz angelegt, nicht auf Inszenierung.

Für Ihre Redaktion können wir anbieten:

•  Vollständige Presseakkreditierung und Zugang zur Pressekonferenz
•  Einzelinterviews mit Dr. Diambilay und ausgewählten Sprechern (Slots sieben Tage im Voraus zu reservieren)
•  Sperrfrist-Pressemappe mit Sprecherbiografien, Sektordaten und hochauflösendem Bildmaterial
•  Ein Vorab-Briefing per Telefon oder Video nach Ihrem Zeitplan

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm: {eventUrl}

Sagen Sie mir bitte, was am besten zu Ihrem Redaktionsplan passt, und ich richte es ein.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

Le {eventDate}, le Diambilay Business Center amène pour la première fois sa masterclass Richesses d'Afrique en Allemagne. Le programme se déroule sur une journée à {eventVenue} et est ouvert à la presse accréditée.

Pourquoi cela compte pour votre lectorat : DBC, fondé en 2023 par le Dr. Jean-Clément Diambilay, est devenu l'une des plateformes les plus visibles reliant les opérateurs africains aux investisseurs internationaux. L'édition parisienne (mai 2025, Palais des Sports) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (mars 2026) et de Libreville (août 2025) ont suivi, avec une couverture soutenue d'Agence Ecofin, d'APA News et des chaînes panafricaines. Essen est le premier chapitre dans l'espace DACH.

L'angle : un incubateur panafricain ouvre un corridor permanent entre l'économie germanophone et les entreprises opérationnelles sur le continent — au moment où l'Allemagne repense activement sa stratégie africaine. Le plateau d'intervenants est composé de fondateurs africains et européens qui dirigent des entreprises en Afrique, et non d'analystes. Le format masterclass est conçu pour la substance, non pour la mise en scène.

Pour votre rédaction, nous pouvons proposer :

•  Une accréditation presse complète et l'accès à la conférence de presse
•  Des entretiens individuels avec le Dr. Diambilay et des intervenants sélectionnés (créneaux réservés sept jours à l'avance)
•  Un dossier de presse sous embargo, avec biographies des intervenants, données sectorielles et visuels haute résolution
•  Un briefing préalable, par téléphone ou en visioconférence, selon votre calendrier

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme : {eventUrl}

Dites-moi simplement ce qui convient le mieux à votre planning éditorial, et je l''organise.

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
  true, 20
),

-- =====================  03. Speaker pitch  =====================
(
  'speaker_pitch',
  'Speaker pitch',
  'Cold first-touch speaking invitation. Contains literal [PERSONALISE] and [DATE] placeholders the operator must fill before sending.',
  'speakers@dbc-germany.com',
  'Invitation to speak — {eventTitle}, {eventDate}',
  'Einladung zum Vortrag – {eventTitle}, {eventDate}',
  'Invitation à intervenir – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

I am writing on behalf of the Diambilay Business Center and its founder Dr. Jean-Clément Diambilay. On {eventDate}, we open the first German edition of our flagship masterclass, {eventTitle}, at {eventVenue}. We would be honoured to have you on stage.

A word on why we are reaching out to you specifically: [PERSONALISE — two to three sentences on the recipient's track record in Africa, the session you have in mind, and why their voice belongs there]. Our rule across every edition has been consistent: we invite operators who have built and scaled real businesses on the continent, not commentators. Your work fits that line precisely.

On the platform itself. Richesses d'Afrique has run in Paris (more than 1,500 participants at the Palais des Sports in May 2025, under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa), in Dakar (Théâtre National Daniel Sorano, March 2026), and in Libreville (August 2025). Essen extends the format into Germany, with a DACH audience of investors, founders and members of the African diaspora preparing concrete entry into African markets.

What we are offering:

•  A format tailored to your expertise — keynote, panel, or in-depth masterclass, your preference
•  Travel and accommodation in {eventCity}, fully covered
•  Professional video and photo of your intervention, delivered for your own use afterwards
•  Distribution across DBC's francophone and African media channels, with a parallel German-language press push from our side

If the principle works for you, I can send the full speaker brief, the working theme and a proposed slot within 48 hours. We would need your confirmation in principle by [DATE] to lock the programme.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

With respect, and in anticipation of your reply,

{senderName}
DBC Germany UG
[Phone] $body_en$,
  $body_de$ {salutation}

ich wende mich an Sie im Namen des Diambilay Business Center und seines Gründers Dr. Jean-Clément Diambilay. Am {eventDate} eröffnen wir die erste deutsche Ausgabe unserer Flagship-Masterclass {eventTitle} in der {eventVenue}. Es wäre uns eine Ehre, Sie auf der Bühne zu sehen.

Ein Wort dazu, warum wir uns gerade an Sie wenden: [PERSONALISE — zwei bis drei Sätze zum Track Record der Person in Afrika, zum vorgesehenen Slot und dazu, warum ihre Stimme dorthin gehört]. Unsere Regel war in jeder Ausgabe konsistent: Wir laden Unternehmer ein, die auf dem Kontinent reale Geschäfte aufgebaut und skaliert haben — keine Kommentatoren. Ihre Arbeit passt genau zu dieser Linie.

Zur Plattform selbst: Richesses d'Afrique fand in Paris statt (mehr als 1.500 Teilnehmer im Palais des Sports im Mai 2025, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa), in Dakar (Théâtre National Daniel Sorano, März 2026) sowie in Libreville (August 2025). Essen erweitert das Format nach Deutschland, mit einem DACH-Publikum aus Investoren, Gründern und Vertretern der afrikanischen Diaspora, die einen konkreten Markteintritt in Afrika vorbereiten.

Was wir Ihnen anbieten:

•  Ein Format, das Ihrer Expertise entspricht — Keynote, Panel oder vertiefende Masterclass, ganz nach Ihrer Wahl
•  Anreise und Übernachtung in {eventCity} vollständig übernommen
•  Professionelle Video- und Fotoaufnahmen Ihres Auftritts, anschließend zu Ihrer eigenen Verwendung übermittelt
•  Distribution über die frankophonen und afrikanischen Medienkanäle von DBC, parallel zur deutschsprachigen Pressearbeit von unserer Seite

Wenn das Prinzip für Sie passt, sende ich Ihnen innerhalb von 48 Stunden das vollständige Sprecher-Briefing, das Leitthema sowie einen Slot-Vorschlag. Eine grundsätzliche Bestätigung Ihrerseits bis zum [DATE] wäre nötig, um das Programm zu finalisieren.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit Respekt und in Erwartung Ihrer Antwort

{senderName}
DBC Germany UG
[Phone] $body_de$,
  $body_fr$ {salutation}

je m'adresse à vous au nom du Diambilay Business Center et de son fondateur, le Dr. Jean-Clément Diambilay. Le {eventDate}, nous ouvrons la première édition allemande de notre masterclass phare {eventTitle} à {eventVenue}. Ce serait pour nous un honneur de vous compter sur scène.

Un mot sur la raison pour laquelle nous nous adressons à vous spécifiquement : [PERSONALISE — deux à trois phrases sur le parcours de la personne en Afrique, le créneau envisagé, et pourquoi sa voix a sa place ici]. Notre règle, d'une édition à l'autre, est constante : nous invitons des opérateurs qui ont bâti et fait croître de véritables entreprises sur le continent, et non des commentateurs. Votre travail correspond précisément à cette ligne.

Sur la plateforme elle-même : Richesses d'Afrique s'est tenu à Paris (plus de 1 500 participants au Palais des Sports en mai 2025, sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa), à Dakar (Théâtre National Daniel Sorano, mars 2026) et à Libreville (août 2025). Essen prolonge le format en Allemagne, avec un public DACH composé d'investisseurs, de fondateurs et de membres de la diaspora africaine qui préparent une entrée concrète sur les marchés africains.

Ce que nous vous offrons :

•  Un format ajusté à votre expertise — keynote, panel ou masterclass approfondie, à votre convenance
•  Le transport et l'hébergement à {eventCity}, intégralement pris en charge
•  Une captation vidéo et photo professionnelle de votre intervention, mise à votre disposition par la suite
•  Une diffusion sur les canaux médias francophones et africains de DBC, en parallèle d'une action presse en allemand de notre côté

Si le principe vous convient, je peux vous transmettre, sous 48 heures, le brief intervenant complet, le fil directeur et un créneau proposé. Une confirmation de principe d'ici le [DATE] serait nécessaire pour verrouiller le programme.

Avec respect, et dans l'attente de votre réponse,

{senderName}
DBC Germany UG
[Phone] $body_fr$,
  true, 30
),

-- =====================  04. Institutional bodies  =====================
(
  'institutional_bodies',
  'Institutional bodies',
  'Patronage / endorsement / panel-seat / delegation invitation for ministries, embassies, multilaterals, development agencies.',
  'sponsors@dbc-germany.com',
  'Institutional patronage and engagement — {eventTitle}, {eventDate}',
  'Institutionelle Schirmherrschaft und Engagement – {eventTitle}, {eventDate}',
  'Patronage institutionnel et engagement – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

On {eventDate}, DBC Germany UG opens the first German edition of Richesses d'Afrique at {eventVenue}. I am writing to invite {organization} to engage with the programme — in a form ranging from official patronage and a written endorsement to a representative on the panel or a delegation in the audience, whichever best fits your mandate.

Richesses d'Afrique is the flagship programme of the Diambilay Business Center, the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. The Paris edition (Palais des Sports, May 2025) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (Théâtre National Daniel Sorano, March 2026) and Libreville (August 2025) extended the format across African capitals. Essen opens the corridor into the DACH region.

The Essen programme is built specifically to advance the question your institution works on: how DACH capital, expertise and trade flows reach operational businesses in Africa, structured securely and with measurable impact. The session topics — agribusiness, energy, digital, legal and tax structuring across jurisdictions, financing access — map directly to the priority areas of German development cooperation and bilateral economic policy.

For your institution, we can structure engagement in several forms:

•  Official patronage and a written endorsement carried in our programme materials
•  A keynote or panel slot for a senior representative
•  A reserved delegation block in the audience, with curated introductions to selected speakers
•  A joint press moment on the DACH–Africa corridor

I would be glad to send the full briefing dossier and discuss which format suits your institutional calendar. A short call in the next two weeks would allow us to lock the right arrangement before our programme goes to print.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

With respect,

{senderName}
DBC Germany UG
Düsseldorf $body_en$,
  $body_de$ {salutation}

am {eventDate} eröffnet die DBC Germany UG die erste deutsche Ausgabe von Richesses d'Afrique in der {eventVenue}. Ich wende mich an Sie, um {organization} einzuladen, sich mit dem Programm zu engagieren — in einer Form, die von offizieller Schirmherrschaft und einer schriftlichen Erklärung über einen Vertreter auf dem Panel bis zu einer Delegation im Publikum reichen kann, je nachdem, was Ihrem Mandat am besten entspricht.

Richesses d'Afrique ist das Flagship-Programm des Diambilay Business Center, des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Die Pariser Ausgabe (Palais des Sports, Mai 2025) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (Théâtre National Daniel Sorano, März 2026) und Libreville (August 2025) führten das Format über mehrere afrikanische Hauptstädte hinweg fort. Essen öffnet den Korridor in den DACH-Raum.

Das Essener Programm ist gezielt darauf ausgerichtet, die Frage zu vertiefen, an der Ihre Institution arbeitet: Wie erreichen DACH-Kapital, Expertise und Handelsströme operative Unternehmen in Afrika — strukturiert, abgesichert und mit messbarer Wirkung. Die Sessionthemen — Agrarwirtschaft, Energie, Digital, rechtliche und steuerliche Strukturierung über Jurisdiktionen hinweg, Zugang zu Finanzierung — entsprechen unmittelbar den Schwerpunkten der deutschen Entwicklungszusammenarbeit und der bilateralen Wirtschaftspolitik.

Für Ihre Institution können wir das Engagement in mehreren Formen ausgestalten:

•  Offizielle Schirmherrschaft und eine schriftliche Erklärung in unseren Programmunterlagen
•  Eine Keynote oder ein Panel-Slot für einen leitenden Vertreter
•  Ein reservierter Delegationsblock im Publikum, mit kuratierten Vorstellungen ausgewählter Sprecher
•  Ein gemeinsamer Pressemoment zum DACH–Afrika-Korridor

Gerne sende ich Ihnen das vollständige Briefing-Dossier zu und stimme mit Ihnen ab, welche Form zu Ihrem institutionellen Kalender passt. Ein kurzes Gespräch in den nächsten zwei Wochen würde uns erlauben, die passende Konstellation zu fixieren, bevor unser Programm in Druck geht.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit Respekt

{senderName}
DBC Germany UG
Düsseldorf $body_de$,
  $body_fr$ {salutation}

le {eventDate}, DBC Germany UG ouvre la première édition allemande de Richesses d'Afrique à {eventVenue}. Je vous écris pour inviter {organization} à s'engager auprès du programme — sous une forme qui peut aller du patronage officiel et d'un soutien écrit jusqu'à un représentant sur le panel ou une délégation dans le public, selon ce qui correspond le mieux à votre mandat.

Richesses d'Afrique est le programme phare du Diambilay Business Center, incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. L'édition parisienne (Palais des Sports, mai 2025) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (Théâtre National Daniel Sorano, mars 2026) et de Libreville (août 2025) ont étendu le format à plusieurs capitales africaines. Essen ouvre le corridor vers l'espace DACH.

Le programme d'Essen est spécifiquement construit pour faire progresser la question sur laquelle votre institution travaille : comment les capitaux, l'expertise et les flux commerciaux DACH atteignent des entreprises opérationnelles en Afrique, de manière structurée, sécurisée et avec un impact mesurable. Les sujets des sessions — agro-industrie, énergie, numérique, structuration juridique et fiscale entre juridictions, accès au financement — correspondent directement aux axes prioritaires de la coopération allemande au développement et de la politique économique bilatérale.

Pour votre institution, nous pouvons structurer l'engagement sous plusieurs formes :

•  Un patronage officiel et un soutien écrit repris dans nos supports de programme
•  Un créneau de keynote ou de panel pour un représentant de haut niveau
•  Un bloc de places réservé en délégation, avec des présentations curatées d'intervenants sélectionnés
•  Un moment de presse conjoint sur le corridor DACH–Afrique

Je serais heureux de vous transmettre le dossier de briefing complet et d'échanger sur la forme qui correspond à votre calendrier institutionnel. Un bref entretien dans les deux prochaines semaines nous permettrait de verrouiller le bon dispositif avant la mise sous presse du programme.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Avec respect,

{senderName}
DBC Germany UG
Düsseldorf $body_fr$,
  true, 40
),

-- =====================  05. Chambers of commerce  =====================
(
  'chambers_of_commerce',
  'Chambers of commerce',
  'Member invitation + institutional partnership for IHKs, AHKs, bilateral chambers. Forwarding ask + preferential bracket offer.',
  'sponsors@dbc-germany.com',
  'Member invitation and partnership — {eventTitle}, {eventDate}',
  'Mitglieder-Einladung und Partnerschaft – {eventTitle}, {eventDate}',
  'Invitation membres et partenariat – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

On {eventDate}, DBC Germany UG hosts the first German edition of Richesses d'Afrique at {eventVenue} — a day-long masterclass on doing business in Africa, built for the audience your membership covers: founders, investors and Mittelstand decision-makers evaluating concrete engagement with the continent.

Richesses d'Afrique is the flagship programme of the Diambilay Business Center, the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. Paris 2025 drew more than 1,500 participants at the Palais des Sports under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (March 2026) and Libreville (August 2025) followed. Essen is the first chapter in the DACH region.

We are reaching out for two reasons. First, to invite {organization} to engage as an institutional partner of the event — visibility in our programme materials, a reserved member delegation, and the option of a co-branded session on a topic of mutual interest (Africa market entry, due diligence, partner identification). Second, to ask whether your team would be willing to forward the invitation to members who fit the profile: companies sourcing from, selling into, or considering investment in African markets.

In return, we can offer a preferential ticket bracket for your members, a named representative slot on the panel if useful, and a short pre-event briefing for your team so any forwarding email goes out with full clarity on what your members will find in the room.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Press kit: {pressKitUrl}
Programme: {eventUrl}

A twenty-minute call would let us shape this in a way that genuinely serves your members. Tell me what works in your calendar.

Kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

am {eventDate} richtet die DBC Germany UG die erste deutsche Ausgabe von Richesses d'Afrique in der {eventVenue} aus — eine ganztägige Masterclass zum Geschäft mit Afrika, gebaut für die Zielgruppe, die Ihre Mitgliedschaft abdeckt: Gründer, Investoren und Mittelstands-Entscheidungsträger, die ein konkretes Engagement auf dem Kontinent prüfen.

Richesses d'Afrique ist das Flagship-Programm des Diambilay Business Center, des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Paris 2025 zog mehr als 1.500 Teilnehmer ins Palais des Sports unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (März 2026) und Libreville (August 2025) folgten. Essen ist das erste Kapitel im DACH-Raum.

Wir wenden uns aus zwei Gründen an Sie. Erstens, um {organization} einzuladen, sich als institutioneller Partner des Events zu engagieren — Sichtbarkeit in unseren Programmunterlagen, eine reservierte Mitgliederdelegation und die Option einer Co-Branded-Session zu einem gemeinsam interessierenden Thema (Markteintritt Afrika, Due Diligence, Partneridentifikation). Zweitens, mit der Frage, ob Ihr Team bereit wäre, die Einladung an die Mitglieder weiterzuleiten, deren Profil passt: Unternehmen, die aus afrikanischen Märkten beziehen, in sie verkaufen oder Investitionen erwägen.

Im Gegenzug bieten wir ein Vorzugskontingent an Tickets für Ihre Mitglieder, einen namentlichen Repräsentantenslot auf dem Panel, falls dienlich, sowie ein kurzes Vorab-Briefing für Ihr Team, damit eine etwaige Weiterleitungsmail mit voller Klarheit ausgeht, was Ihre Mitglieder im Saal erwartet.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm: {eventUrl}

Ein zwanzigminütiges Gespräch würde uns erlauben, dies so zu formen, dass es Ihren Mitgliedern echt dient. Sagen Sie mir, was in Ihrem Kalender passt.

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

le {eventDate}, DBC Germany UG accueille la première édition allemande de Richesses d'Afrique à {eventVenue} — une masterclass d'une journée sur les affaires en Afrique, conçue pour le public que couvre votre adhésion : fondateurs, investisseurs et décideurs du Mittelstand qui évaluent un engagement concret sur le continent.

Richesses d'Afrique est le programme phare du Diambilay Business Center, incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. Paris 2025 a réuni plus de 1 500 participants au Palais des Sports sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (mars 2026) et de Libreville (août 2025) ont suivi. Essen est le premier chapitre dans l'espace DACH.

Nous vous écrivons pour deux raisons. D'abord, pour inviter {organization} à s'engager comme partenaire institutionnel de l'événement — visibilité dans nos supports de programme, délégation membres réservée, et option d'une session en co-branding sur un sujet d'intérêt mutuel (entrée sur les marchés africains, due diligence, identification de partenaires). Ensuite, pour vous demander si vos équipes accepteraient de relayer l'invitation aux membres dont le profil correspond : entreprises qui s'approvisionnent en Afrique, vendent sur le continent, ou envisagent d'y investir.

En contrepartie, nous pouvons offrir un contingent préférentiel de billets pour vos membres, un créneau nominatif sur le panel si cela vous est utile, et un bref briefing préalable pour vos équipes, afin que tout courrier de relais parte avec une parfaite clarté sur ce que vos membres trouveront dans la salle.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme : {eventUrl}

Un échange de vingt minutes nous permettrait de construire cela de façon véritablement utile à vos membres. Dites-moi ce qui convient à votre calendrier.

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
  true, 50
),

-- =====================  06. Investors  =====================
(
  'investors',
  'Investors',
  'Targeted invitation to funds, family offices, LPs. Three engagement formats (reserved seating, 1:1 schedule, optional speaking slot).',
  'sponsors@dbc-germany.com',
  'Curated room for Africa deployment — {eventTitle}, {eventDate}',
  'Kuratiertes Forum für Afrika-Engagements – {eventTitle}, {eventDate}',
  'Salle de travail dédiée à l''Afrique – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

If {organization} is allocating capital to African markets — or seriously considering it — {eventDate} in {eventCity} is worth holding in your diary.

DBC Germany UG opens the first German edition of Richesses d'Afrique at {eventVenue} on that date. It is the flagship programme of the Diambilay Business Center, the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. The Paris edition (Palais des Sports, May 2025) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar and Libreville extended the format across African capitals. Essen is built specifically for the DACH–Africa corridor.

What the room actually contains for an allocator: founders and operators with verifiable track records on the continent (not commentators), a Pan-African and diaspora investor circle deploying alongside DACH capital, and curated sector-by-sector working sessions across agribusiness, energy and digital — with focused time on legal and tax structuring across jurisdictions, partner due diligence and financing routes. The questions that decide whether an African position actually performs.

Three ways we can engage with your team:

•  A reserved investor seating block with introductions to operators matched to your thesis
•  A confidential one-on-one schedule with selected speakers around the programme
•  An optional speaking slot on capital structuring or LP/GP perspective, if you wish to position publicly

We are deliberately keeping the investor circle compact this year so conversations stay substantive. If you would like to be included, I can send the speaker line-up and a short briefing note this week.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

Kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

falls {organization} Kapital in afrikanische Märkte allokiert — oder ernsthaft prüft, dies zu tun —, lohnt es sich, den {eventDate} in {eventCity} im Kalender zu halten.

Die DBC Germany UG eröffnet an diesem Datum die erste deutsche Ausgabe von Richesses d'Afrique in der {eventVenue}. Es handelt sich um das Flagship-Programm des Diambilay Business Center, des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Die Pariser Ausgabe (Palais des Sports, Mai 2025) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar und Libreville führten das Format über afrikanische Hauptstädte fort. Essen ist gezielt für den DACH–Afrika-Korridor gebaut.

Was der Saal für einen Allokator konkret enthält: Gründer und Unternehmer mit belegbarem Track Record auf dem Kontinent (keine Kommentatoren), ein panafrikanischer und diaspora-getragener Investorenkreis, der parallel zu DACH-Kapital allokiert, sowie kuratierte sektorale Arbeitssessions zu Agrarwirtschaft, Energie und Digital — mit fokussierter Zeit für rechtliche und steuerliche Strukturierung über Jurisdiktionen hinweg, Partner-Due-Diligence und Finanzierungswege. Die Fragen, die darüber entscheiden, ob eine Afrika-Position tatsächlich performt.

Drei Wege, wie wir mit Ihrem Team arbeiten können:

•  Ein reservierter Investorenblock mit Vorstellungen zu Unternehmern, die zu Ihrer Thesis passen
•  Ein vertraulicher Einzelterminplan mit ausgewählten Sprechern rund um das Programm
•  Ein optionaler Speaking-Slot zu Kapitalstrukturierung oder zur LP/GP-Perspektive, falls Sie sich öffentlich positionieren möchten

Wir halten den Investorenkreis dieses Jahr bewusst kompakt, damit die Gespräche substanziell bleiben. Wenn Sie dabei sein möchten, sende ich Ihnen diese Woche das Sprecher-Line-up sowie eine kurze Briefing-Notiz.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

si {organization} alloue des capitaux aux marchés africains — ou l'envisage sérieusement —, la date du {eventDate} à {eventCity} mérite une place dans votre agenda.

DBC Germany UG ouvre ce jour-là la première édition allemande de Richesses d'Afrique à {eventVenue}. Il s'agit du programme phare du Diambilay Business Center, incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. L'édition parisienne (Palais des Sports, mai 2025) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar et de Libreville ont prolongé le format à travers les capitales africaines. Essen est construite spécifiquement pour le corridor DACH–Afrique.

Ce que la salle contient concrètement pour un allocataire : des fondateurs et opérateurs avec un parcours vérifiable sur le continent (et non des commentateurs), un cercle d'investisseurs panafricains et issus de la diaspora qui déploient aux côtés de capitaux DACH, et des sessions de travail sectorielles curatées en agro-industrie, énergie et numérique — avec un temps dédié à la structuration juridique et fiscale entre juridictions, à la due diligence des partenaires et aux voies de financement. Les questions qui déterminent réellement la performance d'une position africaine.

Trois façons de travailler avec vos équipes :

•  Un bloc de places investisseurs réservé, avec des présentations d'opérateurs alignés sur votre thèse
•  Un agenda confidentiel d'entretiens individuels avec des intervenants sélectionnés autour du programme
•  Un créneau de prise de parole optionnel sur la structuration des capitaux ou la perspective LP/GP, si vous souhaitez vous positionner publiquement

Nous gardons cette année le cercle des investisseurs délibérément compact, pour que les échanges restent substantiels. Si vous souhaitez en être, je vous transmets dans la semaine le plateau d'intervenants ainsi qu'une brève note de briefing.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
  true, 60
),

-- =====================  07. Diaspora associations  =====================
(
  'diaspora_associations',
  'Diaspora associations',
  'Community-partner invitation for African / Congolese diaspora associations in Germany. Mutual ask (engagement + ticket bracket + word-of-mouth).',
  'info@dbc-germany.com',
  'An invitation to the community — {eventTitle}, {eventDate}',
  'Einladung an die Community – {eventTitle}, {eventDate}',
  'Invitation à la communauté – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

On {eventDate}, the Diambilay Business Center comes to Germany for the first time. We open Richesses d'Afrique Masterclass at {eventVenue}, and I am writing to invite {organization} to be there — visibly, and as a recognised partner of the day.

You know what we know: there is enormous business and investment ambition in the African and Congolese community across Germany, and not enough structured rooms where that ambition meets people who have actually built and scaled real companies in Africa. Richesses d'Afrique was created for exactly that purpose. It is the flagship programme of DBC, the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. Paris 2025 drew more than 1,500 participants at the Palais des Sports. Dakar followed in March 2026. Libreville in August 2025. Essen is the chapter that finally opens this door in the DACH region.

What we would like from {organization}:

•  Your visible engagement as a community partner, listed in our programme materials and named on the day
•  A preferential bracket of tickets we can reserve for your members
•  Help carrying the word to the people in your network who belong in that room — entrepreneurs, professionals, families ready to invest back home

What we offer in return: a recognised place in the programme, a reserved delegation block, and a moment on stage to address the community if that suits you. Dr. Diambilay will personally meet community partners during the day.

This is the first time we open this format in Germany. The community we build into the room on {eventDate} will be the foundation for everything that follows in the DACH region. I would value a short call to walk through this with you in the coming week.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

With respect, and looking forward to working with you,

{senderName}
DBC Germany UG
[Phone] $body_en$,
  $body_de$ {salutation}

am {eventDate} kommt das Diambilay Business Center zum ersten Mal nach Deutschland. Wir eröffnen die Richesses d'Afrique Masterclass in der {eventVenue}, und ich wende mich an Sie, um {organization} einzuladen, dabei zu sein — sichtbar, und als anerkannter Partner des Tages.

Sie wissen, was wir wissen: In der afrikanischen und kongolesischen Community in Deutschland gibt es enorme unternehmerische und investive Ambition — und zu wenige strukturierte Räume, in denen diese Ambition auf Menschen trifft, die in Afrika tatsächlich reale Unternehmen aufgebaut und skaliert haben. Richesses d'Afrique wurde genau zu diesem Zweck geschaffen. Es ist das Flagship-Programm von DBC, dem panafrikanischen Inkubator, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Paris 2025 zog mehr als 1.500 Teilnehmer ins Palais des Sports. Dakar folgte im März 2026. Libreville im August 2025. Essen ist das Kapitel, das diese Tür im DACH-Raum endlich öffnet.

Was wir uns von {organization} wünschen:

•  Ihr sichtbares Engagement als Community-Partner, gelistet in unseren Programmunterlagen und am Tag genannt
•  Ein Vorzugskontingent an Tickets, das wir für Ihre Mitglieder reservieren
•  Unterstützung dabei, das Wort an die Menschen in Ihrem Netzwerk weiterzutragen, die in diesen Saal gehören — Unternehmer, Berufstätige, Familien, die bereit sind, zu Hause zu investieren

Was wir im Gegenzug bieten: einen anerkannten Platz im Programm, einen reservierten Delegationsblock, und einen Moment auf der Bühne, um sich an die Community zu wenden, falls Ihnen das passt. Dr. Diambilay wird Community-Partner am Tag persönlich treffen.

Es ist das erste Mal, dass wir dieses Format in Deutschland öffnen. Die Community, die wir am {eventDate} in den Saal bringen, wird das Fundament für alles sein, was im DACH-Raum darauf folgt. Ein kurzes Gespräch in der kommenden Woche, in dem wir dies mit Ihnen durchgehen, wäre mir wertvoll.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit Respekt, und in Vorfreude auf die Zusammenarbeit

{senderName}
DBC Germany UG
[Phone] $body_de$,
  $body_fr$ {salutation}

le {eventDate}, le Diambilay Business Center vient en Allemagne pour la première fois. Nous ouvrons la Richesses d'Afrique Masterclass à {eventVenue}, et je vous écris pour inviter {organization} à y être — de manière visible, et en tant que partenaire reconnu de la journée.

Vous savez ce que nous savons : il y a, dans la communauté africaine et congolaise en Allemagne, une énorme ambition entrepreneuriale et d'investissement — et pas assez d'espaces structurés où cette ambition rencontre des personnes qui ont véritablement bâti et fait croître des entreprises en Afrique. Richesses d'Afrique a été créé précisément pour cela. C'est le programme phare de DBC, l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. Paris 2025 a réuni plus de 1 500 participants au Palais des Sports. Dakar a suivi en mars 2026. Libreville en août 2025. Essen est le chapitre qui ouvre enfin cette porte dans l'espace DACH.

Ce que nous attendons de {organization} :

•  Votre engagement visible en tant que partenaire communautaire, mentionné dans nos supports de programme et nommé le jour même
•  Un contingent préférentiel de billets que nous pouvons réserver pour vos membres
•  Votre aide pour relayer l'invitation aux personnes de votre réseau dont la place est dans cette salle — entrepreneurs, professionnels, familles prêts à investir dans leur pays d'origine

Ce que nous offrons en retour : une place reconnue dans le programme, un bloc de délégation réservé, et un moment sur scène pour vous adresser à la communauté si cela vous convient. Le Dr. Diambilay rencontrera personnellement les partenaires communautaires au cours de la journée.

C'est la première fois que nous ouvrons ce format en Allemagne. La communauté que nous ferons entrer dans la salle le {eventDate} sera le fondement de tout ce qui suivra dans l'espace DACH. Un bref échange dans la semaine à venir, pour passer cela en revue avec vous, me serait précieux.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Avec respect, et dans l'attente de notre collaboration,

{senderName}
DBC Germany UG
[Phone] $body_fr$,
  true, 70
),

-- =====================  08. Corporates  =====================
(
  'corporates',
  'Corporates',
  'Delegation invitation for DAX/MDAX/Mittelstand corporates with Africa interest. Three formats (delegation block, speaking slot, event partnership).',
  'sponsors@dbc-germany.com',
  'Delegation invitation — {eventTitle}, {eventDate}',
  'Delegations-Einladung – {eventTitle}, {eventDate}',
  'Invitation délégation – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

For companies running operations in Africa or building toward them, {eventDate} in {eventCity} is positioned to be a useful day.

DBC Germany UG opens the first German edition of Richesses d'Afrique at {eventVenue} on that date. The programme is the flagship of the Diambilay Business Center, the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. Paris 2025 drew more than 1,500 participants at the Palais des Sports under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (March 2026) and Libreville (August 2025) followed. Essen is the first chapter in the DACH region.

The relevance for {organization}: the room is composed of African and European operators with verifiable track records on the continent, DACH investors actively evaluating entry, and senior members of the African diaspora in Germany. Sessions are organised around the operational questions corporates care about — sector strategy in agribusiness, energy and digital, legal and tax structuring across jurisdictions, partner due diligence, supplier and distribution networks, and routes to financing.

Three formats of engagement for your team:

•  A corporate delegation block with reserved seats and introductions to operators matched to your African footprint
•  A speaking slot for a senior representative on the company's Africa strategy or a case study, useful for positioning
•  Partnership of the event itself, with a visibility tier matched to your communications calendar

A short call would let us understand which format fits your year. I can send the partnership deck and the speaker line-up ahead of the conversation.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

Kind regards,

{senderName}
DBC Germany UG $body_en$,
  $body_de$ {salutation}

für Unternehmen, die in Afrika operativ tätig sind oder darauf hin aufbauen, ist der {eventDate} in {eventCity} ein Datum, das einen nützlichen Tag darstellen wird.

Die DBC Germany UG eröffnet an diesem Datum die erste deutsche Ausgabe von Richesses d'Afrique in der {eventVenue}. Das Programm ist das Flagship des Diambilay Business Center, des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Paris 2025 zog mehr als 1.500 Teilnehmer ins Palais des Sports unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (März 2026) und Libreville (August 2025) folgten. Essen ist das erste Kapitel im DACH-Raum.

Die Relevanz für {organization}: Der Saal ist besetzt mit afrikanischen und europäischen Unternehmern, die belegbare Track Records auf dem Kontinent haben, mit DACH-Investoren, die einen Markteintritt aktiv prüfen, sowie mit leitenden Vertretern der afrikanischen Diaspora in Deutschland. Die Sessions sind um die operativen Fragen organisiert, die für Konzerne zählen — Sektorstrategie in Agrarwirtschaft, Energie und Digital, rechtliche und steuerliche Strukturierung über Jurisdiktionen hinweg, Partner-Due-Diligence, Lieferanten- und Distributionsnetze sowie Wege zur Finanzierung.

Drei Engagement-Formate für Ihr Team:

•  Ein Konzern-Delegationsblock mit reservierten Plätzen und Vorstellungen zu Unternehmern, die zu Ihrem afrikanischen Footprint passen
•  Ein Speaking-Slot für einen leitenden Vertreter zur Afrika-Strategie des Unternehmens oder zu einer Fallstudie, hilfreich für die Positionierung
•  Eine Partnerschaft am Event selbst, mit einer Visibilitätsstufe, die zu Ihrem Kommunikationskalender passt

Ein kurzes Gespräch würde uns erlauben zu verstehen, welches Format zu Ihrem Jahr passt. Ich sende Ihnen das Partnerschafts-Deck und das Sprecher-Line-up vorab zur Vorbereitung.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit freundlichen Grüßen

{senderName}
DBC Germany UG $body_de$,
  $body_fr$ {salutation}

pour les entreprises présentes en Afrique ou qui s'y dirigent, la date du {eventDate} à {eventCity} est positionnée pour être une journée utile.

DBC Germany UG ouvre ce jour-là la première édition allemande de Richesses d'Afrique à {eventVenue}. Le programme est le programme phare du Diambilay Business Center, incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. Paris 2025 a réuni plus de 1 500 participants au Palais des Sports sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (mars 2026) et de Libreville (août 2025) ont suivi. Essen est le premier chapitre dans l'espace DACH.

La pertinence pour {organization} : la salle est composée d'opérateurs africains et européens dont le parcours sur le continent est vérifiable, d'investisseurs DACH qui évaluent activement une entrée, et de membres seniors de la diaspora africaine en Allemagne. Les sessions sont organisées autour des questions opérationnelles qui importent aux grands groupes — stratégie sectorielle en agro-industrie, énergie et numérique, structuration juridique et fiscale entre juridictions, due diligence des partenaires, réseaux de fournisseurs et de distribution, et voies d'accès au financement.

Trois formats d'engagement pour vos équipes :

•  Un bloc de places en délégation entreprise, avec des présentations d'opérateurs alignés sur votre empreinte africaine
•  Un créneau de prise de parole pour un représentant senior sur la stratégie Afrique de l'entreprise ou sur une étude de cas, utile pour le positionnement
•  Un partenariat avec l'événement lui-même, avec un niveau de visibilité adapté à votre calendrier de communication

Un bref échange nous permettrait de comprendre quel format correspond à votre année. Je peux vous transmettre le dossier de partenariat et le plateau d'intervenants en amont de la conversation.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Cordialement,

{senderName}
DBC Germany UG $body_fr$,
  true, 80
),

-- =====================  09. VIPs and protocol  =====================
(
  'vips_and_protocol',
  'VIPs & protocol',
  'Official invitation for high-protocol guests (ambassadors, ministers, heads of state). Operator should override the salutation line for Excellency / Honourable cases.',
  'info@dbc-germany.com',
  'Official invitation — {eventTitle}, {eventDate}',
  'Offizielle Einladung – {eventTitle}, {eventDate}',
  'Invitation officielle – {eventTitle}, le {eventDate}',
  $body_en$ {salutation}

It is my honour, on behalf of the Diambilay Business Center and its founder Dr. Jean-Clément Diambilay, to invite you to attend the first German edition of Richesses d'Afrique Masterclass, hosted by DBC Germany UG at {eventVenue} on {eventDate}.

Richesses d'Afrique is the flagship programme of DBC, the Pan-African incubator founded in 2023. The Paris edition was held at the Palais des Sports in May 2025 under the patronage of Madame Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa, and drew more than 1,500 participants. Editions followed in Dakar (Théâtre National Daniel Sorano, March 2026) and Libreville (August 2025). The Essen edition opens the format into Germany and into the DACH–Africa economic corridor.

Your presence would be a significant honour for the programme and a meaningful gesture for the African and diaspora communities we convene. We would respectfully propose:

•  A reserved seat in the protocol section, with the option of a brief address from the stage if you wish
•  A reception with Dr. Diambilay and the speaker delegation before the public programme opens
•  Direct liaison with our protocol team to coordinate with your office's standard procedures

The programme runs from {eventTime} at {eventVenue}, {eventAddress}. The full agenda and a logistical and security briefing will be provided to your office in due course.

I remain at your disposal to coordinate with your protocol team and to provide any further details required.

With my highest consideration,

{senderName}
DBC Germany UG
Düsseldorf
[Phone] $body_en$,
  $body_de$ {salutation}

es ist mir eine Ehre, Sie im Namen des Diambilay Business Center und seines Gründers Dr. Jean-Clément Diambilay einzuladen, an der ersten deutschen Ausgabe der Richesses d'Afrique Masterclass teilzunehmen, ausgerichtet von der DBC Germany UG in der {eventVenue} am {eventDate}.

Richesses d'Afrique ist das Flagship-Programm von DBC, dem panafrikanischen Inkubator, der 2023 gegründet wurde. Die Pariser Ausgabe fand im Mai 2025 im Palais des Sports statt, unter der Schirmherrschaft von Madame Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa, und zog mehr als 1.500 Teilnehmer an. Ausgaben folgten in Dakar (Théâtre National Daniel Sorano, März 2026) und Libreville (August 2025). Die Essener Ausgabe öffnet das Format nach Deutschland und in den deutschsprachig-afrikanischen Wirtschaftskorridor.

Ihre Anwesenheit wäre eine bedeutende Ehre für das Programm und eine bedeutsame Geste gegenüber den afrikanischen und Diaspora-Gemeinschaften, die wir versammeln. Wir würden respektvoll vorschlagen:

•  Einen reservierten Platz im Protokollbereich, mit der Option einer kurzen Ansprache von der Bühne, falls Sie es wünschen
•  Einen Empfang mit Dr. Diambilay und der Sprecherdelegation vor Beginn des öffentlichen Programms
•  Direkte Abstimmung mit unserem Protokollteam, um sich an den Standardverfahren Ihres Büros auszurichten

Das Programm läuft von {eventTime} in der {eventVenue}, {eventAddress}. Die vollständige Agenda sowie ein logistisches und sicherheitsbezogenes Briefing werden Ihrem Büro zu gegebener Zeit übermittelt.

Ich stehe Ihnen zur Abstimmung mit Ihrem Protokollteam und für jede weitere erforderliche Auskunft zur Verfügung.

Mit vorzüglicher Hochachtung

{senderName}
DBC Germany UG
Düsseldorf
[Phone] $body_de$,
  $body_fr$ {salutation}

c'est un honneur, au nom du Diambilay Business Center et de son fondateur, le Dr. Jean-Clément Diambilay, de vous inviter à assister à la première édition allemande de la Richesses d'Afrique Masterclass, organisée par DBC Germany UG à {eventVenue} le {eventDate}.

Richesses d'Afrique est le programme phare de DBC, incubateur panafricain fondé en 2023. L'édition parisienne s'est tenue au Palais des Sports en mai 2025 sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa, et a réuni plus de 1 500 participants. Des éditions ont suivi à Dakar (Théâtre National Daniel Sorano, mars 2026) et à Libreville (août 2025). L'édition d'Essen ouvre le format à l'Allemagne et au corridor économique DACH–Afrique.

Votre présence constituerait un honneur considérable pour le programme et un geste significatif pour les communautés africaines et de la diaspora que nous réunissons. Nous nous permettons respectueusement de proposer :

•  Une place réservée dans la section protocolaire, avec la possibilité d'une brève allocution depuis la scène si vous le souhaitez
•  Une réception avec le Dr. Diambilay et la délégation des intervenants avant l'ouverture du programme public
•  Une liaison directe avec notre équipe protocolaire pour s'aligner sur les procédures de votre cabinet

Le programme se déroule de {eventTime} à {eventVenue}, {eventAddress}. L'agenda complet ainsi qu'un briefing logistique et sécuritaire seront transmis à votre cabinet en temps utile.

Je reste à votre disposition pour me coordonner avec votre équipe protocolaire et pour vous communiquer toute information complémentaire requise.

Avec ma haute considération,

{senderName}
DBC Germany UG
Düsseldorf
[Phone] $body_fr$,
  true, 90
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
