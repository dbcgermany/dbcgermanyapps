-- =============================================================================
-- 20260516000010  outreach_native_full_rewrite
-- =============================================================================
-- Full native rewrite of all 9 outreach template bodies in EN / DE / FR.
-- Driven by user feedback that prior versions had:
--   • English grammar problems ("Help carrying" — should be bare infinitive)
--   • German anglicisms and calques ("Kapital allokiert", "performt",
--     "Partner-Roster", "Flagship-Programm", "über Jurisdiktionen hinweg",
--     "im Kalender zu halten")
--   • French stiffness ("non des commentateurs" → "et non…", "qui évaluent
--     une entrée" → "qui étudient leur entrée")
--   • Preposition errors with {eventVenue} in DE / FR — "in Messe Essen"
--     ungrammatical (Messe = feminine). Fix: {eventVenue} is now used ONLY
--     in the stacked event-details block, NEVER inside a prepositional
--     phrase in prose. Prose mentions location via {eventCity} only.
--   • "DBC Germany UG" everywhere in body — already replaced globally with
--     "DBC Germany" in a prior REPLACE on 2026-05-14; this migration
--     preserves "DBC Germany" throughout (no UG).
--
-- Subjects unchanged from migration 20260516000008 (they read clean per
-- audience). Only bodies updated here. ON CONFLICT (slug) DO UPDATE on
-- (subject, body, sort) is unnecessary since rows already exist — using
-- plain UPDATE keyed by slug.
--
-- Re-runs are idempotent (each UPDATE simply rewrites the body columns).
-- =============================================================================

-- ============================================================  01. Sponsor
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

DBC Germany is bringing Richesses d'Afrique to Germany for the first time. The event takes place on {eventDate} in {eventCity}.

Richesses d'Afrique is the flagship programme of the Diambilay Business Center — the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. The Paris edition (Palais des Sports, May 2025) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Further editions ran in Dakar (Théâtre National Daniel Sorano, March 2026) and in Libreville (August 2025). Across every edition, the rule is the same: speakers are operators who have built and scaled real companies in Africa — not commentators who write about them.

The Essen edition is designed for the DACH–Africa corridor. It brings three audiences into the same room:

• Founders and operators running profitable businesses on the continent
• DACH investors, family offices and corporates evaluating market entry into Africa
• Members of the African and Congolese diaspora in Germany ready to deploy capital, skills and networks

The working theme is "Invest in Africa. Structure, secure and capitalise on opportunity." The programme covers sector strategy in agribusiness, energy and digital; legal and tax structuring across multiple jurisdictions; partner due diligence; and access to financing — the questions that determine whether an African investment actually performs.

We are currently finalising our partner roster. Sponsorship is structured in tiers, each carrying distinct exposure to the room and to our cross-border media presence in the French, German, English and African press. For {organization}, we would propose the {pitchTier} tier. I would be glad to send you the partnership deck and walk you through the elements that fit your objectives. A twenty-minute call next week would be enough to map this out.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Press kit: {pressKitUrl}
Programme and tickets: {eventUrl}

Kind regards,

{senderName}
DBC Germany
Düsseldorf $body_en$,
  body_de = $body_de$ {salutation}

DBC Germany bringt Richesses d'Afrique zum ersten Mal nach Deutschland. Die Veranstaltung findet am {eventDate} in {eventCity} statt.

Richesses d'Afrique ist das Leitprogramm des Diambilay Business Center — des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Die Pariser Ausgabe (Palais des Sports, Mai 2025) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Weitere Ausgaben fanden in Dakar (Théâtre National Daniel Sorano, März 2026) und in Libreville (August 2025) statt. In jeder Ausgabe gilt dieselbe Regel: Auf der Bühne stehen Unternehmer, die in Afrika reale Geschäfte aufgebaut und ausgebaut haben — keine Kommentatoren, die darüber schreiben.

Die Essener Ausgabe ist auf den Wirtschaftskorridor zwischen DACH und Afrika zugeschnitten. Sie bringt drei Zielgruppen im selben Saal zusammen:

• Gründer und Unternehmer, die profitable Geschäfte auf dem Kontinent betreiben
• DACH-Investoren, Family Offices und Konzerne, die einen Markteintritt in Afrika prüfen
• Vertreter der afrikanischen und kongolesischen Diaspora in Deutschland, bereit, Kapital, Kompetenzen und Netzwerke einzusetzen

Das Leitthema lautet: „In Afrika investieren. Strukturieren, absichern und Chancen rentabilisieren." Das Programm behandelt Sektorstrategien in Landwirtschaft, Energie und Digitalwirtschaft; rechtliche und steuerliche Gestaltung in mehreren Rechtsräumen; die Prüfung möglicher Partner; sowie Wege zur Finanzierung — genau die Fragen, die darüber entscheiden, ob ein Afrika-Engagement Erträge bringt.

Wir stellen derzeit unsere Partnerliste fertig. Das Sponsoring ist gestaffelt aufgebaut; jede Stufe bietet eine klar definierte Sichtbarkeit im Saal sowie in unserer grenzüberschreitenden Medienarbeit in der französischen, deutschen, englischen und afrikanischen Presse. Für {organization} würden wir die Stufe {pitchTier} vorschlagen. Gerne lasse ich Ihnen die Sponsoring-Unterlage zukommen und gehe mit Ihnen die Punkte durch, die zu Ihren Zielen passen. Ein zwanzigminütiges Gespräch in der kommenden Woche würde dafür genügen.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm und Tickets: {eventUrl}

Mit freundlichen Grüßen

{senderName}
DBC Germany
Düsseldorf $body_de$,
  body_fr = $body_fr$ {salutation}

DBC Germany accueille pour la première fois Richesses d'Afrique en Allemagne. L'événement se tiendra le {eventDate} à {eventCity}.

Richesses d'Afrique est le programme phare du Diambilay Business Center — l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. L'édition parisienne (Palais des Sports, mai 2025) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. D'autres éditions se sont tenues à Dakar (Théâtre National Daniel Sorano, mars 2026) et à Libreville (août 2025). D'une édition à l'autre, la règle reste la même : les intervenants sont des opérateurs qui ont bâti et développé de véritables entreprises en Afrique, et non des commentateurs qui les observent.

L'édition d'Essen est pensée pour le corridor économique DACH–Afrique. Elle réunit trois publics dans une même salle :

• Fondateurs et dirigeants d'entreprises rentables sur le continent
• Investisseurs DACH, family offices et grands groupes qui étudient leur entrée sur les marchés africains
• Membres de la diaspora africaine et congolaise en Allemagne, prêts à déployer capital, compétences et réseaux

Le fil directeur est le suivant : « Investir en Afrique. Structurer, sécuriser et rentabiliser les opportunités. » Le programme couvre la stratégie sectorielle en agro-industrie, énergie et numérique ; la structuration juridique et fiscale dans plusieurs juridictions ; l'évaluation des partenaires ; et l'accès au financement — autant de questions qui déterminent réellement la performance d'un investissement africain.

Nous finalisons actuellement notre liste de partenaires. Le sponsoring est structuré en niveaux, chacun offrant une exposition distincte dans la salle ainsi que dans notre présence médiatique transfrontalière (presse française, allemande, anglaise et africaine). Pour {organization}, nous proposerions le niveau {pitchTier}. Je serais heureux de vous adresser le dossier de partenariat et de parcourir avec vous les éléments qui correspondent à vos objectifs. Un échange de vingt minutes la semaine prochaine suffirait à le préciser.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme et billets : {eventUrl}

Cordialement,

{senderName}
DBC Germany
Düsseldorf $body_fr$
WHERE slug = 'sponsor_pitch';

-- ============================================================  02. Press
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

On {eventDate}, the Diambilay Business Center brings its Richesses d'Afrique masterclass to Germany for the first time. The day-long programme takes place in {eventCity} and is open to accredited press.

Why this matters for your readers: DBC, founded in 2023 by Dr. Jean-Clément Diambilay, has become one of the most visible platforms connecting African operators with international investors. The Paris edition (May 2025, Palais des Sports) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (March 2026) and Libreville (August 2025) followed, with sustained coverage from Agence Ecofin, APA News and Pan-African broadcasters. Essen is the first chapter in the DACH region.

The angle: a Pan-African incubator opens a permanent corridor between the German-speaking economy and operational businesses on the continent, as Germany rethinks its Africa strategy. The speakers are African and European founders who actually run companies in Africa — not analysts who write about them. The masterclass format is built for substance, not pageantry.

We can offer your desk:

• Full press accreditation and access to the press conference
• One-on-one interviews with Dr. Diambilay and selected speakers (please book at least seven days in advance)
• An embargoed press kit with speaker bios, sector data and high-resolution visuals
• A pre-event phone or video briefing at a time that suits your schedule

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
DBC Germany $body_en$,
  body_de = $body_de$ {salutation}

am {eventDate} bringt das Diambilay Business Center seine Richesses d'Afrique Masterclass zum ersten Mal nach Deutschland. Das ganztägige Programm findet in {eventCity} statt und steht akkreditierten Pressevertretern offen.

Warum dies für Ihre Leserschaft relevant ist: DBC, 2023 von Dr. Jean-Clément Diambilay gegründet, hat sich zu einer der sichtbarsten Plattformen entwickelt, die afrikanische Unternehmer mit internationalen Investoren verbindet. Die Pariser Ausgabe (Palais des Sports, Mai 2025) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (März 2026) und Libreville (August 2025) folgten, mit fortlaufender Berichterstattung von Agence Ecofin, APA News und panafrikanischen Rundfunkanstalten. Essen ist das erste Kapitel im DACH-Raum.

Der redaktionelle Aufhänger: Ein panafrikanischer Inkubator öffnet einen dauerhaften Korridor zwischen der deutschsprachigen Wirtschaft und operativen Unternehmen auf dem Kontinent — genau zu dem Zeitpunkt, an dem Deutschland seine Afrika-Strategie neu denkt. Die Sprecher sind afrikanische und europäische Gründer, die in Afrika tatsächlich Unternehmen führen — keine Analysten, die darüber schreiben. Das Masterclass-Format ist auf Substanz angelegt, nicht auf Inszenierung.

Wir können Ihrer Redaktion anbieten:

• Vollständige Presseakkreditierung sowie Zugang zur Pressekonferenz
• Einzelinterviews mit Dr. Diambilay und ausgewählten Sprechern (bitte mindestens sieben Tage im Voraus anmelden)
• Eine Pressemappe unter Sperrfrist, mit Sprecherbiografien, Sektordaten und hochauflösendem Bildmaterial
• Ein Vorab-Briefing per Telefon oder Video zu einem Zeitpunkt, der Ihrem Zeitplan entspricht

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
DBC Germany $body_de$,
  body_fr = $body_fr$ {salutation}

le {eventDate}, le Diambilay Business Center amène pour la première fois sa masterclass Richesses d'Afrique en Allemagne. Le programme se déroule sur une journée à {eventCity} et est ouvert à la presse accréditée.

Pourquoi cela compte pour votre lectorat : DBC, fondé en 2023 par le Dr. Jean-Clément Diambilay, est devenu l'une des plateformes les plus visibles reliant les opérateurs africains aux investisseurs internationaux. L'édition parisienne (Palais des Sports, mai 2025) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (mars 2026) et de Libreville (août 2025) ont suivi, avec une couverture régulière d'Agence Ecofin, d'APA News et des chaînes panafricaines. Essen est le premier chapitre dans l'espace DACH.

L'angle : un incubateur panafricain ouvre un corridor permanent entre l'économie germanophone et les entreprises opérationnelles sur le continent, au moment où l'Allemagne repense sa stratégie africaine. Les intervenants sont des fondateurs africains et européens qui dirigent réellement des entreprises en Afrique — et non des analystes qui les observent. Le format masterclass est conçu pour la substance, non pour la mise en scène.

Nous pouvons proposer à votre rédaction :

• Une accréditation presse complète ainsi que l'accès à la conférence de presse
• Des entretiens individuels avec le Dr. Diambilay et des intervenants sélectionnés (à réserver au moins sept jours à l'avance)
• Un dossier de presse sous embargo, avec biographies des intervenants, données sectorielles et visuels en haute définition
• Un briefing préalable, par téléphone ou en visioconférence, au moment qui vous convient

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Dossier de presse : {pressKitUrl}
Programme : {eventUrl}

Dites-moi simplement ce qui convient le mieux à votre planning éditorial, et je l'organise.

Cordialement,

{senderName}
DBC Germany $body_fr$
WHERE slug = 'press_pitch';

-- ============================================================  03. Speaker
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

I am writing on behalf of the Diambilay Business Center and its founder Dr. Jean-Clément Diambilay. On {eventDate}, we open the first German edition of our flagship masterclass, Richesses d'Afrique, in {eventCity}. We would be honoured to have you on stage.

A word on why we are reaching out to you specifically: [PERSONALISE — two to three sentences on the recipient's track record in Africa, the session we have in mind, and why their voice belongs there]. Our rule across every edition has been consistent: we invite operators who have built and scaled real businesses on the continent, not commentators. Your work fits that line precisely.

A word on the platform itself. Richesses d'Afrique was held in Paris (more than 1,500 participants at the Palais des Sports in May 2025, under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa), then in Dakar (Théâtre National Daniel Sorano, March 2026) and in Libreville (August 2025). Essen extends the format into Germany, with a DACH audience of investors, founders and members of the African diaspora preparing concrete entry into African markets.

What we are offering:

• A format that suits your expertise — keynote, panel, or in-depth masterclass, as you prefer
• Travel and accommodation in {eventCity}, fully covered
• Professional video and photo of your intervention, delivered to you afterwards for your own use
• Distribution across DBC's francophone and African media channels, with a parallel German-language press push from our side

If the idea is of interest, I can send you the full speaker brief, the working theme and a proposed slot within 48 hours. We would need your agreement in principle by [DATE] in order to lock the programme.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

With respect, and in anticipation of your reply,

{senderName}
DBC Germany
[Phone] $body_en$,
  body_de = $body_de$ {salutation}

ich wende mich an Sie im Namen des Diambilay Business Center und seines Gründers Dr. Jean-Clément Diambilay. Am {eventDate} eröffnen wir in {eventCity} die erste deutsche Ausgabe unserer Masterclass Richesses d'Afrique. Es wäre uns eine Ehre, Sie auf der Bühne begrüßen zu dürfen.

Ein Wort dazu, warum wir uns gerade an Sie wenden: [PERSONALISE — zwei bis drei Sätze zur unternehmerischen Erfolgsbilanz der Person in Afrika, zur vorgesehenen Sitzung und dazu, warum ihre Stimme dorthin gehört]. Unsere Regel war in jeder Ausgabe konsistent: Wir laden Unternehmer ein, die auf dem Kontinent reale Geschäfte aufgebaut und ausgebaut haben — keine Kommentatoren. Ihre Arbeit passt genau zu dieser Linie.

Ein Wort zur Plattform selbst: Richesses d'Afrique fand in Paris statt (mehr als 1.500 Teilnehmer im Palais des Sports im Mai 2025, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa), anschließend in Dakar (Théâtre National Daniel Sorano, März 2026) und in Libreville (August 2025). Essen erweitert das Format nach Deutschland — mit einem DACH-Publikum aus Investoren, Gründern und Vertretern der afrikanischen Diaspora, die einen konkreten Markteintritt in Afrika vorbereiten.

Was wir Ihnen anbieten:

• Ein Format, das zu Ihrer Expertise passt — Keynote, Panel oder vertiefende Masterclass, ganz nach Ihrer Wahl
• Anreise und Übernachtung in {eventCity} vollständig übernommen
• Professionelle Video- und Fotoaufnahmen Ihres Auftritts, anschließend zur eigenen Verwendung übergeben
• Verbreitung über die frankophonen und afrikanischen Medienkanäle von DBC, parallel zu unserer deutschsprachigen Pressearbeit

Wenn der Gedanke für Sie passt, sende ich Ihnen innerhalb von 48 Stunden das vollständige Sprecher-Briefing, das Leitthema sowie einen Vorschlag für Ihren Auftritt. Eine grundsätzliche Zusage Ihrerseits bis zum [DATE] wäre nötig, damit wir das Programm fertigstellen können.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit Respekt und in Erwartung Ihrer Antwort

{senderName}
DBC Germany
[Phone] $body_de$,
  body_fr = $body_fr$ {salutation}

je m'adresse à vous au nom du Diambilay Business Center et de son fondateur, le Dr. Jean-Clément Diambilay. Le {eventDate}, nous ouvrons à {eventCity} la première édition allemande de notre masterclass Richesses d'Afrique. Ce serait pour nous un honneur de vous compter sur scène.

Un mot sur la raison pour laquelle nous nous adressons à vous spécifiquement : [PERSONALISE — deux à trois phrases sur le parcours de la personne en Afrique, la session envisagée, et pourquoi sa voix a sa place ici]. Notre règle, d'une édition à l'autre, est constante : nous invitons des opérateurs qui ont bâti et développé de véritables entreprises sur le continent, et non des commentateurs. Votre travail correspond précisément à cette ligne.

Un mot sur la plateforme elle-même : Richesses d'Afrique s'est tenu à Paris (plus de 1 500 participants au Palais des Sports en mai 2025, sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa), puis à Dakar (Théâtre National Daniel Sorano, mars 2026) et à Libreville (août 2025). Essen prolonge le format en Allemagne, avec un public DACH composé d'investisseurs, de fondateurs et de membres de la diaspora africaine qui préparent une entrée concrète sur les marchés africains.

Ce que nous vous offrons :

• Un format ajusté à votre expertise — keynote, panel ou masterclass approfondie, à votre convenance
• Le transport et l'hébergement à {eventCity}, intégralement pris en charge
• Une captation vidéo et photo professionnelle de votre intervention, mise à votre disposition par la suite
• Une diffusion sur les canaux médias francophones et africains de DBC, en parallèle d'une action presse en allemand de notre côté

Si l'idée vous intéresse, je peux vous transmettre, sous 48 heures, le brief intervenant complet, le fil directeur et un créneau proposé. Une confirmation de principe d'ici le [DATE] serait nécessaire pour finaliser le programme.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Avec respect, et dans l'attente de votre réponse,

{senderName}
DBC Germany
[Phone] $body_fr$
WHERE slug = 'speaker_pitch';

-- ============================================================  04. Institutional bodies
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

On {eventDate}, DBC Germany opens the first German edition of Richesses d'Afrique in {eventCity}. We would like to invite {organization} to engage with the programme — in a form ranging from official patronage and a written endorsement to a representative on the panel or a delegation in the audience, whichever best suits your mandate.

Richesses d'Afrique is the flagship programme of the Diambilay Business Center — the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. The Paris edition (Palais des Sports, May 2025) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (Théâtre National Daniel Sorano, March 2026) and Libreville (August 2025) extended the format across African capitals. Essen opens the corridor into the DACH region.

The Essen programme is designed to advance the question your institution addresses: how DACH capital, expertise and trade flows reach operational businesses in Africa, in a structured and secure way and with measurable impact. The session topics — agribusiness, energy, digital, legal and tax structuring across multiple jurisdictions, access to financing — map directly to the priority areas of German development cooperation and of bilateral economic policy.

For your institution, we can shape the engagement in several ways:

• Official patronage and a written endorsement carried in our programme materials
• A keynote or panel slot for a senior representative
• A reserved delegation block in the audience, with curated introductions to selected speakers
• A joint press moment on the DACH–Africa corridor

I would be glad to send the full briefing dossier and discuss which format suits your institutional calendar. A short call in the next two weeks would allow us to lock the right arrangement before our programme goes to print.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

With respect,

{senderName}
DBC Germany
Düsseldorf $body_en$,
  body_de = $body_de$ {salutation}

am {eventDate} eröffnet DBC Germany in {eventCity} die erste deutsche Ausgabe von Richesses d'Afrique. Wir möchten {organization} einladen, sich am Programm zu beteiligen — in einer Form, die von offizieller Schirmherrschaft und einer schriftlichen Erklärung über einen Vertreter auf dem Panel bis zu einer Delegation im Publikum reichen kann, je nachdem, was Ihrem Mandat am besten entspricht.

Richesses d'Afrique ist das Leitprogramm des Diambilay Business Center — des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Die Pariser Ausgabe (Palais des Sports, Mai 2025) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (Théâtre National Daniel Sorano, März 2026) und Libreville (August 2025) führten das Format über mehrere afrikanische Hauptstädte hinweg fort. Essen öffnet den Korridor in den DACH-Raum.

Das Essener Programm ist darauf ausgerichtet, die Frage zu vertiefen, an der Ihre Institution arbeitet: wie DACH-Kapital, Expertise und Handelsströme operative Unternehmen in Afrika erreichen — strukturiert, abgesichert und mit messbarer Wirkung. Die Sessionthemen — Landwirtschaft, Energie, Digitalwirtschaft, rechtliche und steuerliche Gestaltung in mehreren Rechtsräumen, Zugang zu Finanzierung — entsprechen unmittelbar den Schwerpunkten der deutschen Entwicklungszusammenarbeit und der bilateralen Wirtschaftspolitik.

Für Ihre Institution können wir das Engagement in mehreren Formen ausgestalten:

• Offizielle Schirmherrschaft und eine schriftliche Erklärung in unseren Programmunterlagen
• Eine Keynote oder ein Panelplatz für einen leitenden Vertreter
• Ein reservierter Delegationsblock im Publikum, mit gezielten Vorstellungen ausgewählter Sprecher
• Ein gemeinsamer Pressemoment zum Wirtschaftskorridor DACH–Afrika

Gerne sende ich Ihnen das vollständige Briefing-Dossier zu und stimme mit Ihnen ab, welche Form zu Ihrem institutionellen Kalender passt. Ein kurzes Gespräch in den nächsten zwei Wochen würde uns erlauben, die passende Form festzulegen, bevor unser Programm in Druck geht.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit Respekt

{senderName}
DBC Germany
Düsseldorf $body_de$,
  body_fr = $body_fr$ {salutation}

le {eventDate}, DBC Germany ouvre à {eventCity} la première édition allemande de Richesses d'Afrique. Nous souhaitons inviter {organization} à s'associer au programme — sous une forme qui peut aller du patronage officiel et d'un soutien écrit jusqu'à un représentant sur le panel ou une délégation dans le public, selon ce qui correspond le mieux à votre mandat.

Richesses d'Afrique est le programme phare du Diambilay Business Center — l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. L'édition parisienne (Palais des Sports, mai 2025) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (Théâtre National Daniel Sorano, mars 2026) et de Libreville (août 2025) ont étendu le format à plusieurs capitales africaines. Essen ouvre le corridor vers l'espace DACH.

Le programme d'Essen est conçu pour faire avancer la question sur laquelle votre institution travaille : comment les capitaux, l'expertise et les flux commerciaux DACH atteignent des entreprises opérationnelles en Afrique, de manière structurée et sécurisée, et avec un impact mesurable. Les sujets des sessions — agro-industrie, énergie, numérique, structuration juridique et fiscale dans plusieurs juridictions, accès au financement — correspondent directement aux axes prioritaires de la coopération allemande au développement et de la politique économique bilatérale.

Pour votre institution, nous pouvons structurer l'engagement sous plusieurs formes :

• Un patronage officiel et un soutien écrit repris dans nos supports de programme
• Un créneau de keynote ou de panel pour un représentant de haut niveau
• Un bloc de places réservé en délégation, avec des présentations ciblées d'intervenants sélectionnés
• Un moment de presse conjoint sur le corridor économique DACH–Afrique

Je serais heureux de vous transmettre le dossier de briefing complet et d'échanger sur la forme qui correspond à votre calendrier institutionnel. Un bref entretien dans les deux prochaines semaines nous permettrait d'arrêter la bonne formule avant la mise sous presse du programme.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Avec respect,

{senderName}
DBC Germany
Düsseldorf $body_fr$
WHERE slug = 'institutional_bodies';

-- ============================================================  05. Chambers of commerce
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

On {eventDate}, DBC Germany hosts the first German edition of Richesses d'Afrique in {eventCity} — a day-long masterclass on doing business in Africa, designed for the audience your members serve: founders, investors and Mittelstand decision-makers evaluating concrete engagement with the continent.

Richesses d'Afrique is the flagship programme of the Diambilay Business Center — the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. Paris 2025 drew more than 1,500 participants at the Palais des Sports under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (March 2026) and Libreville (August 2025) followed. Essen is the first chapter in the DACH region.

We are reaching out for two reasons. First, to invite {organization} to engage as an institutional partner of the event — visibility in our programme materials, a reserved member delegation, and the option of a co-branded session on a topic of mutual interest (Africa market entry, due diligence, partner identification). Second, to ask whether your team would be willing to forward the invitation to members who fit the profile: companies sourcing from, selling into, or considering investment in African markets.

In return, we can offer a preferential ticket bracket for your members, a named representative slot on the panel if that is useful, and a short pre-event briefing for your team so that any forwarding email goes out with full clarity on what your members will find in the room.

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
DBC Germany $body_en$,
  body_de = $body_de$ {salutation}

am {eventDate} richtet DBC Germany in {eventCity} die erste deutsche Ausgabe von Richesses d'Afrique aus — eine ganztägige Masterclass zum Geschäft mit Afrika, ausgelegt auf die Zielgruppe, die Ihre Mitglieder bedienen: Gründer, Investoren und Mittelstands-Entscheidungsträger, die ein konkretes Engagement auf dem Kontinent prüfen.

Richesses d'Afrique ist das Leitprogramm des Diambilay Business Center — des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Paris 2025 zog mehr als 1.500 Teilnehmer ins Palais des Sports, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (März 2026) und Libreville (August 2025) folgten. Essen ist das erste Kapitel im DACH-Raum.

Wir wenden uns aus zwei Gründen an Sie. Erstens, um {organization} einzuladen, sich als institutioneller Partner der Veranstaltung zu beteiligen — Sichtbarkeit in unseren Programmunterlagen, eine reservierte Mitgliederdelegation und die Option einer gemeinsam gebrandeten Sitzung zu einem Thema beiderseitigen Interesses (Markteintritt Afrika, Due-Diligence-Prüfung, Identifizierung von Partnern). Zweitens, mit der Frage, ob Ihr Team bereit wäre, die Einladung an die Mitglieder weiterzuleiten, deren Profil passt: Unternehmen, die aus afrikanischen Märkten beziehen, dorthin verkaufen oder Investitionen erwägen.

Im Gegenzug bieten wir ein Vorzugskontingent an Tickets für Ihre Mitglieder, einen namentlichen Repräsentanten-Platz auf dem Panel, falls hilfreich, sowie ein kurzes Vorab-Briefing für Ihr Team, damit eine etwaige Weiterleitungsmail mit voller Klarheit ausgeht, was Ihre Mitglieder im Saal erwartet.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Pressemappe: {pressKitUrl}
Programm: {eventUrl}

Ein zwanzigminütiges Gespräch würde uns erlauben, dies so zu gestalten, dass es Ihren Mitgliedern wirklich dient. Sagen Sie mir, was in Ihrem Kalender passt.

Mit freundlichen Grüßen

{senderName}
DBC Germany $body_de$,
  body_fr = $body_fr$ {salutation}

le {eventDate}, DBC Germany accueille à {eventCity} la première édition allemande de Richesses d'Afrique — une masterclass d'une journée sur les affaires en Afrique, conçue pour le public que servent vos membres : fondateurs, investisseurs et décideurs du Mittelstand qui évaluent un engagement concret sur le continent.

Richesses d'Afrique est le programme phare du Diambilay Business Center — l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. Paris 2025 a réuni plus de 1 500 participants au Palais des Sports sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (mars 2026) et de Libreville (août 2025) ont suivi. Essen est le premier chapitre dans l'espace DACH.

Nous vous écrivons pour deux raisons. D'abord, pour inviter {organization} à s'associer à l'événement en tant que partenaire institutionnel — visibilité dans nos supports de programme, délégation de membres réservée, et option d'une session en co-branding sur un sujet d'intérêt mutuel (entrée sur les marchés africains, due diligence, identification de partenaires). Ensuite, pour vous demander si vos équipes accepteraient de relayer l'invitation aux membres dont le profil correspond : entreprises qui s'approvisionnent en Afrique, y vendent, ou envisagent d'y investir.

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
DBC Germany $body_fr$
WHERE slug = 'chambers_of_commerce';

-- ============================================================  06. Investors
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

If {organization} is already investing in African markets — or seriously considering it — {eventDate} in {eventCity} is a date worth keeping in your calendar.

That day, DBC Germany opens the first German edition of Richesses d'Afrique. It is the flagship programme of the Diambilay Business Center — the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. The Paris edition (Palais des Sports, May 2025) drew more than 1,500 participants under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Further editions ran in Dakar (Théâtre National Daniel Sorano, March 2026) and in Libreville (August 2025). The Essen edition is designed for the DACH–Africa corridor.

What an allocator will find in the room: founders and operators with a verifiable track record on the continent — not commentators. A Pan-African and diaspora investor circle deploying alongside DACH capital. Carefully curated working sessions on agribusiness, energy and digital, with dedicated time on legal and tax structuring across multiple jurisdictions, partner due diligence, and routes to financing — the questions that determine whether an African position performs.

Three ways we can work with your team:

• A reserved investor block with introductions to operators matched to your investment thesis
• A confidential schedule of one-on-one conversations with selected speakers around the programme
• An optional speaking slot on capital structuring or the LP/GP perspective, if you would like to position publicly

We are deliberately keeping the investor circle small this year so the conversations stay substantive. If you would like to be included, I can send the speaker list and a brief note this week.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

Kind regards,

{senderName}
DBC Germany $body_en$,
  body_de = $body_de$ {salutation}

falls {organization} bereits in afrikanische Märkte investiert oder ein Engagement in Erwägung zieht, möchten wir Ihnen den {eventDate} in {eventCity} empfehlen.

An diesem Tag eröffnet DBC Germany die erste deutsche Ausgabe von Richesses d'Afrique. Es ist das Leitprogramm des Diambilay Business Center — des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Die Pariser Ausgabe (Palais des Sports, Mai 2025) zog mehr als 1.500 Teilnehmer an, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Weitere Ausgaben fanden in Dakar (Théâtre National Daniel Sorano, März 2026) und in Libreville (August 2025) statt. Die Essener Ausgabe richtet sich speziell an den Wirtschaftskorridor zwischen DACH und Afrika.

Was Sie als Investor im Saal vorfinden: Gründer und Unternehmer mit nachweisbarer Erfolgsbilanz auf dem Kontinent — keine Kommentatoren. Einen Kreis panafrikanischer und in der Diaspora verwurzelter Investoren, der gemeinsam mit DACH-Kapital investiert. Sorgfältig zusammengestellte Arbeitssitzungen nach Sektoren — Landwirtschaft, Energie und Digitalwirtschaft — mit Schwerpunkt auf rechtlicher und steuerlicher Gestaltung in mehreren Rechtsräumen, der Prüfung möglicher Partner sowie Wegen zur Finanzierung. Genau die Fragen, die letztlich darüber entscheiden, ob ein Afrika-Engagement Erträge bringt.

Wir können auf drei Arten mit Ihrem Team arbeiten:

• Eine reservierte Sitzgruppe für Investoren, mit gezielten Vorstellungen zu Unternehmern, die zu Ihrer Anlagethese passen
• Ein vertraulicher Terminplan für Einzelgespräche mit ausgewählten Sprechern am Rande des Programms
• Auf Wunsch ein eigener Vortragsslot zu Kapitalstrukturierung oder zur Perspektive von LP/GP, falls Sie sich öffentlich positionieren möchten

Wir halten den Kreis der eingeladenen Investoren in diesem Jahr bewusst klein, damit die Gespräche an Tiefe gewinnen. Wenn Sie dabei sein möchten, sende ich Ihnen noch diese Woche die Sprecherübersicht und eine kurze Vorab-Notiz.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit freundlichen Grüßen

{senderName}
DBC Germany $body_de$,
  body_fr = $body_fr$ {salutation}

si {organization} investit déjà sur les marchés africains — ou l'envisage sérieusement — la date du {eventDate} à {eventCity} mérite une place dans votre agenda.

Ce jour-là, DBC Germany ouvre la première édition allemande de Richesses d'Afrique. Il s'agit du programme phare du Diambilay Business Center — l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. L'édition parisienne (Palais des Sports, mai 2025) a réuni plus de 1 500 participants sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. D'autres éditions se sont tenues à Dakar (Théâtre National Daniel Sorano, mars 2026) et à Libreville (août 2025). L'édition d'Essen est pensée pour le corridor économique DACH–Afrique.

Ce qu'un investisseur trouve dans la salle : des fondateurs et dirigeants avec un parcours vérifiable sur le continent — et non des commentateurs. Un cercle d'investisseurs panafricains et issus de la diaspora, qui déploient leurs capitaux aux côtés des capitaux DACH. Des sessions de travail soigneusement préparées, organisées par secteur — agro-industrie, énergie, numérique — avec un temps dédié à la structuration juridique et fiscale dans plusieurs juridictions, à l'évaluation des partenaires et aux différentes voies de financement. Ce sont précisément les questions qui déterminent la performance d'un investissement africain.

Trois formats possibles avec vos équipes :

• Un bloc de places réservé aux investisseurs, avec des présentations ciblées d'opérateurs alignés sur votre thèse
• Un agenda confidentiel d'entretiens individuels avec des intervenants sélectionnés, en marge du programme
• Sur demande, un créneau de prise de parole sur la structuration des capitaux ou la perspective LP/GP, si vous souhaitez vous positionner publiquement

Nous gardons cette année le cercle des investisseurs volontairement restreint, afin que les échanges gagnent en profondeur. Si vous souhaitez en être, je vous transmets cette semaine la liste des intervenants ainsi qu'une note préparatoire.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Cordialement,

{senderName}
DBC Germany $body_fr$
WHERE slug = 'investors';

-- ============================================================  07. Diaspora associations
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

On {eventDate}, the Diambilay Business Center comes to Germany for the first time. We open Richesses d'Afrique Masterclass in {eventCity}, and I am writing to invite {organization} to be there — visibly, and as a recognised partner of the day.

You know what we know: there is enormous business and investment ambition in the African and Congolese community across Germany, and not enough structured rooms where that ambition meets people who have actually built and scaled real companies in Africa. Richesses d'Afrique was created for exactly that purpose. It is the flagship programme of DBC — the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. Paris 2025 drew more than 1,500 participants at the Palais des Sports. Dakar followed in March 2026. Libreville in August 2025. Essen is the chapter that finally opens this door in the DACH region.

What we would like from {organization}:

• Your visible engagement as a community partner, listed in our programme materials and named on the day
• A preferential bracket of tickets we can reserve for your members
• Help in carrying the word to the people in your network who belong in that room — entrepreneurs, professionals, families ready to invest back home

What we offer in return: a recognised place in the programme, a reserved delegation block, and a moment on stage to address the community if that suits you. Dr. Diambilay will personally meet community partners during the day.

This is the first time we open this format in Germany. The community we bring into the room on {eventDate} will be the foundation for everything that follows in the DACH region. I would value a short call to walk through this with you in the coming week.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

With respect, and looking forward to working with you,

{senderName}
DBC Germany
[Phone] $body_en$,
  body_de = $body_de$ {salutation}

am {eventDate} kommt das Diambilay Business Center zum ersten Mal nach Deutschland. Wir eröffnen die Richesses d'Afrique Masterclass in {eventCity}, und ich wende mich an Sie, um {organization} einzuladen, dabei zu sein — sichtbar, und als anerkannter Partner des Tages.

Sie wissen, was wir wissen: In der afrikanischen und kongolesischen Community in Deutschland gibt es enorme unternehmerische und investive Ambition — und zu wenige strukturierte Räume, in denen diese Ambition auf Menschen trifft, die in Afrika tatsächlich reale Unternehmen aufgebaut und ausgebaut haben. Richesses d'Afrique wurde genau zu diesem Zweck geschaffen. Es ist das Leitprogramm von DBC — dem panafrikanischen Inkubator, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Paris 2025 zog mehr als 1.500 Teilnehmer ins Palais des Sports. Dakar folgte im März 2026. Libreville im August 2025. Essen ist das Kapitel, das diese Tür im DACH-Raum endlich öffnet.

Was wir uns von {organization} wünschen:

• Ihr sichtbares Engagement als Community-Partner, gelistet in unseren Programmunterlagen und am Tag genannt
• Ein Vorzugskontingent an Tickets, das wir für Ihre Mitglieder reservieren
• Unterstützung dabei, das Wort an die Menschen in Ihrem Netzwerk weiterzutragen, die in diesen Saal gehören — Unternehmer, Berufstätige und Familien, die bereit sind, zu Hause zu investieren

Was wir im Gegenzug bieten: einen anerkannten Platz im Programm, einen reservierten Delegationsblock und einen Moment auf der Bühne, um sich an die Community zu wenden, falls Ihnen das passt. Dr. Diambilay wird die Community-Partner am Tag persönlich treffen.

Es ist das erste Mal, dass wir dieses Format in Deutschland öffnen. Die Community, die wir am {eventDate} in den Saal bringen, wird das Fundament für alles sein, was im DACH-Raum darauf folgt. Ein kurzes Gespräch in der kommenden Woche, in dem wir dies mit Ihnen durchgehen, wäre mir wertvoll.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit Respekt, und in Vorfreude auf die Zusammenarbeit

{senderName}
DBC Germany
[Phone] $body_de$,
  body_fr = $body_fr$ {salutation}

le {eventDate}, le Diambilay Business Center vient en Allemagne pour la première fois. Nous ouvrons la Richesses d'Afrique Masterclass à {eventCity}, et je vous écris pour inviter {organization} à y être — de manière visible, et en tant que partenaire reconnu de la journée.

Vous savez ce que nous savons : il y a, dans la communauté africaine et congolaise en Allemagne, une énorme ambition entrepreneuriale et d'investissement — et pas assez d'espaces structurés où cette ambition rencontre des personnes qui ont véritablement bâti et développé des entreprises en Afrique. Richesses d'Afrique a été créé précisément pour cela. C'est le programme phare de DBC — l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. Paris 2025 a réuni plus de 1 500 participants au Palais des Sports. Dakar a suivi en mars 2026. Libreville en août 2025. Essen est le chapitre qui ouvre enfin cette porte dans l'espace DACH.

Ce que nous souhaiterions de la part de {organization} :

• Votre engagement visible en tant que partenaire communautaire, mentionné dans nos supports de programme et nommé le jour même
• Un contingent préférentiel de billets que nous pouvons réserver pour vos membres
• Votre aide pour relayer l'invitation aux personnes de votre réseau dont la place est dans cette salle — entrepreneurs, professionnels, familles prêts à investir dans leur pays d'origine

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
DBC Germany
[Phone] $body_fr$
WHERE slug = 'diaspora_associations';

-- ============================================================  08. Corporates
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

For companies operating in Africa, or building toward it, {eventDate} in {eventCity} is a date worth holding in your calendar.

On that day, DBC Germany opens the first German edition of Richesses d'Afrique. It is the flagship programme of the Diambilay Business Center — the Pan-African incubator founded in 2023 by Dr. Jean-Clément Diambilay. Paris 2025 drew more than 1,500 participants at the Palais des Sports under the patronage of Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa. Editions in Dakar (March 2026) and Libreville (August 2025) followed. Essen is the first chapter in the DACH region.

The relevance for {organization}: the room is made up of African and European operators with verifiable track records on the continent, DACH investors actively evaluating entry, and senior members of the African diaspora in Germany. The sessions are organised around the operational questions corporates care about — sector strategy in agribusiness, energy and digital; legal and tax structuring across multiple jurisdictions; partner due diligence; supplier and distribution networks; and routes to financing.

Three formats of engagement for your team:

• A corporate delegation block with reserved seats and introductions to operators matched to your African footprint
• A speaking slot for a senior representative on the company's Africa strategy or a case study, useful for positioning
• Partnership of the event itself, with a visibility tier matched to your communications calendar

A short call would let us understand which format fits your year. I can send you the partnership deck and the speaker list ahead of the conversation.

Event details
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme: {eventUrl}

Kind regards,

{senderName}
DBC Germany $body_en$,
  body_de = $body_de$ {salutation}

für Unternehmen, die in Afrika operativ tätig sind oder den Schritt dorthin vorbereiten, ist der {eventDate} in {eventCity} ein Datum, das einen Platz in Ihrem Kalender verdient.

An diesem Tag eröffnet DBC Germany die erste deutsche Ausgabe von Richesses d'Afrique. Es ist das Leitprogramm des Diambilay Business Center — des panafrikanischen Inkubators, der 2023 von Dr. Jean-Clément Diambilay gegründet wurde. Paris 2025 zog mehr als 1.500 Teilnehmer ins Palais des Sports, unter der Schirmherrschaft von Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa. Ausgaben in Dakar (März 2026) und Libreville (August 2025) folgten. Essen ist das erste Kapitel im DACH-Raum.

Die Relevanz für {organization}: Der Saal versammelt afrikanische und europäische Unternehmer mit nachweisbaren Erfolgen auf dem Kontinent, DACH-Investoren, die einen Markteintritt aktiv prüfen, sowie leitende Vertreter der afrikanischen Diaspora in Deutschland. Die Sitzungen sind um die operativen Fragen organisiert, die für Konzerne zählen — Sektorstrategien in Landwirtschaft, Energie und Digitalwirtschaft; rechtliche und steuerliche Gestaltung in mehreren Rechtsräumen; die Prüfung möglicher Partner; Lieferanten- und Distributionsnetze; sowie Wege zur Finanzierung.

Drei Formate des Engagements für Ihr Team:

• Ein Konzern-Delegationsblock mit reservierten Plätzen und gezielten Vorstellungen zu Unternehmern, die zu Ihrer Präsenz in Afrika passen
• Ein Vortragsslot für einen leitenden Vertreter zur Afrika-Strategie des Unternehmens oder zu einer Fallstudie, hilfreich für die Positionierung
• Eine Partnerschaft an der Veranstaltung selbst, mit einer Sichtbarkeitsstufe, die zu Ihrem Kommunikationskalender passt

Ein kurzes Gespräch würde uns erlauben zu verstehen, welches Format zu Ihrem Jahr passt. Ich sende Ihnen das Partnerschafts-Deck und die Sprecherübersicht vor dem Gespräch zu.

Veranstaltungsdaten
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programm: {eventUrl}

Mit freundlichen Grüßen

{senderName}
DBC Germany $body_de$,
  body_fr = $body_fr$ {salutation}

pour les entreprises présentes en Afrique ou qui s'y dirigent, la date du {eventDate} à {eventCity} mérite une place dans votre agenda.

Ce jour-là, DBC Germany ouvre la première édition allemande de Richesses d'Afrique. Il s'agit du programme phare du Diambilay Business Center — l'incubateur panafricain fondé en 2023 par le Dr. Jean-Clément Diambilay. Paris 2025 a réuni plus de 1 500 participants au Palais des Sports sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa. Les éditions de Dakar (mars 2026) et de Libreville (août 2025) ont suivi. Essen est le premier chapitre dans l'espace DACH.

La pertinence pour {organization} : la salle réunit des opérateurs africains et européens dont le parcours sur le continent est vérifiable, des investisseurs DACH qui évaluent activement une entrée, et des membres seniors de la diaspora africaine en Allemagne. Les sessions sont organisées autour des questions opérationnelles qui importent aux grands groupes — stratégie sectorielle en agro-industrie, énergie et numérique ; structuration juridique et fiscale dans plusieurs juridictions ; évaluation des partenaires ; réseaux de fournisseurs et de distribution ; et voies d'accès au financement.

Trois formats d'engagement pour vos équipes :

• Un bloc de places en délégation entreprise, avec des présentations ciblées d'opérateurs alignés sur votre empreinte africaine
• Un créneau de prise de parole pour un représentant senior sur la stratégie Afrique de l'entreprise ou sur une étude de cas, utile pour le positionnement
• Un partenariat avec l'événement lui-même, avec un niveau de visibilité adapté à votre calendrier de communication

Un bref échange nous permettrait de comprendre quel format correspond à votre année. Je peux vous transmettre le dossier de partenariat et la liste des intervenants en amont de la conversation.

Données de l'événement
{eventTitle}
{eventDate}, {eventTime}
{eventVenue}
{eventAddress}

Programme : {eventUrl}

Cordialement,

{senderName}
DBC Germany $body_fr$
WHERE slug = 'corporates';

-- ============================================================  09. VIPs & protocol
UPDATE public.outreach_templates SET
  body_en = $body_en$ {salutation}

It is my honour, on behalf of the Diambilay Business Center and its founder Dr. Jean-Clément Diambilay, to invite you to attend the first German edition of Richesses d'Afrique Masterclass, hosted by DBC Germany in {eventCity} on {eventDate}.

Richesses d'Afrique is the flagship programme of DBC, the Pan-African incubator founded in 2023. The Paris edition was held at the Palais des Sports in May 2025 under the patronage of Madame Elisabeth Moreno, Chairwoman of Ring Capital and Ring Africa, and drew more than 1,500 participants. Editions followed in Dakar (Théâtre National Daniel Sorano, March 2026) and Libreville (August 2025). The Essen edition opens the format into Germany and into the DACH–Africa economic corridor.

Your presence would be a significant honour for the programme and a meaningful gesture toward the African and diaspora communities we bring together. We would respectfully propose:

• A reserved seat in the protocol section, with the option of a brief address to the room if you wish
• A reception with Dr. Diambilay and the speaker delegation before the public programme opens
• Direct liaison with our protocol team to align with the standard procedures of your office

The programme runs from {eventTime} at {eventVenue}, {eventAddress}. The full agenda, along with a logistical and security briefing, will be provided to your office in due course.

I remain at your disposal to coordinate with your protocol team and to provide any further detail required.

With my highest consideration,

{senderName}
DBC Germany
Düsseldorf
[Phone] $body_en$,
  body_de = $body_de$ {salutation}

es ist mir eine Ehre, Sie im Namen des Diambilay Business Center und seines Gründers Dr. Jean-Clément Diambilay einzuladen, an der ersten deutschen Ausgabe der Richesses d'Afrique Masterclass teilzunehmen, ausgerichtet von DBC Germany in {eventCity} am {eventDate}.

Richesses d'Afrique ist das Leitprogramm von DBC, dem panafrikanischen Inkubator, der 2023 gegründet wurde. Die Pariser Ausgabe fand im Mai 2025 im Palais des Sports statt, unter der Schirmherrschaft von Madame Elisabeth Moreno, Aufsichtsratsvorsitzende von Ring Capital und Ring Africa, und zog mehr als 1.500 Teilnehmer an. Weitere Ausgaben folgten in Dakar (Théâtre National Daniel Sorano, März 2026) und in Libreville (August 2025). Die Essener Ausgabe öffnet das Format nach Deutschland und in den Wirtschaftskorridor zwischen DACH und Afrika.

Ihre Anwesenheit wäre eine bedeutende Ehre für das Programm und eine bedeutsame Geste gegenüber den afrikanischen und der Diaspora-Gemeinschaft, die wir zusammenführen. Wir würden respektvoll vorschlagen:

• Einen reservierten Platz im Protokollbereich, mit der Möglichkeit einer kurzen Ansprache an das Auditorium, falls Sie es wünschen
• Einen Empfang mit Dr. Diambilay und der Sprecherdelegation vor Beginn des öffentlichen Programms
• Direkte Abstimmung mit unserem Protokollteam, um sich an den Standardverfahren Ihres Büros auszurichten

Das Programm läuft von {eventTime} in der {eventVenue}, {eventAddress}. Die vollständige Agenda sowie ein logistisches und sicherheitsbezogenes Briefing werden Ihrem Büro zu gegebener Zeit übermittelt.

Ich stehe Ihnen zur Abstimmung mit Ihrem Protokollteam und für jede weitere erforderliche Auskunft zur Verfügung.

Mit vorzüglicher Hochachtung

{senderName}
DBC Germany
Düsseldorf
[Phone] $body_de$,
  body_fr = $body_fr$ {salutation}

c'est un honneur, au nom du Diambilay Business Center et de son fondateur, le Dr. Jean-Clément Diambilay, de vous inviter à assister à la première édition allemande de la Richesses d'Afrique Masterclass, organisée par DBC Germany à {eventCity} le {eventDate}.

Richesses d'Afrique est le programme phare de DBC, l'incubateur panafricain fondé en 2023. L'édition parisienne s'est tenue au Palais des Sports en mai 2025 sous le patronage de Madame Elisabeth Moreno, Présidente de Ring Capital et Ring Africa, et a réuni plus de 1 500 participants. Des éditions ont suivi à Dakar (Théâtre National Daniel Sorano, mars 2026) et à Libreville (août 2025). L'édition d'Essen ouvre le format à l'Allemagne et au corridor économique DACH–Afrique.

Votre présence constituerait un honneur considérable pour le programme et un geste significatif envers les communautés africaines et de la diaspora que nous réunissons. Nous nous permettons respectueusement de proposer :

• Une place réservée dans la section protocolaire, avec la possibilité d'une brève allocution à l'attention de la salle si vous le souhaitez
• Une réception avec le Dr. Diambilay et la délégation des intervenants avant l'ouverture du programme public
• Une liaison directe avec notre équipe protocolaire pour s'aligner sur les procédures de votre cabinet

Le programme se déroule de {eventTime} à {eventVenue}, {eventAddress}. L'agenda complet ainsi qu'un briefing logistique et sécuritaire seront transmis à votre cabinet en temps utile.

Je reste à votre disposition pour me coordonner avec votre équipe protocolaire et pour vous transmettre toute information complémentaire requise.

Avec ma haute considération,

{senderName}
DBC Germany
Düsseldorf
[Phone] $body_fr$
WHERE slug = 'vips_and_protocol';
