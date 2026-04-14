-- Populate trilingual bio for Ruth Bambi.
UPDATE public.team_members
  SET
    bio_en =
'Ruth Bambi leads DBC Germany as Project Manager and Subsidiary Manager — the single point of contact for German partners, sponsors, and DACH entrepreneurs joining DBC programmes. She coordinates the Düsseldorf office and keeps the programme pipeline in sync with DBC International in Lubumbashi.

Ruth is a graduate of the Rhine-Waal University of Applied Sciences in Kleve and brings an international career in fashion (Eastwest Models, Rothman Models) to her operator role at DBC. Bicultural by nature, she pairs a Congolese entrepreneurial sensibility with a sharp German execution style — perfect for the bridge that DBC Germany is meant to be between African ventures and the DACH market.

You''ll hear from her when you apply for incubation, sign a sponsor deal, or need the German side of a Richesses d''Afrique edition to actually happen.',
    bio_de =
'Ruth Bambi leitet DBC Germany als Projektleiterin und Niederlassungsleitung — die zentrale Ansprechpartnerin für deutsche Partner, Sponsoren und Gründer:innen aus dem DACH-Raum, die an DBC-Programmen teilnehmen. Sie koordiniert das Düsseldorfer Büro und hält die Programme mit DBC International in Lubumbashi synchron.

Ruth ist Absolventin der Hochschule Rhein-Waal in Kleve und bringt eine internationale Karriere in der Modebranche (Eastwest Models, Rothman Models) in ihre operative Rolle bei DBC ein. Bikulturell geprägt verbindet sie kongolesisches Unternehmer:innen-Gespür mit deutscher Umsetzungsstärke — genau die Brücke, die DBC Germany zwischen afrikanischen Unternehmen und dem DACH-Markt sein soll.

Sie meldet sich bei Ihnen, wenn Sie sich für die Inkubation bewerben, ein Sponsoring abschließen oder wenn die deutsche Seite einer Richesses-d''Afrique-Ausgabe tatsächlich passieren muss.',
    bio_fr =
'Ruth Bambi dirige DBC Germany en tant que Chef de projet et Directrice de filiale — point de contact unique pour les partenaires allemands, les sponsors et les entrepreneurs DACH rejoignant les programmes DBC. Elle coordonne le bureau de Düsseldorf et maintient la cohérence des programmes avec DBC International à Lubumbashi.

Diplômée de la Hochschule Rhein-Waal à Kleve, Ruth apporte à son rôle d''opératrice chez DBC une carrière internationale dans la mode (Eastwest Models, Rothman Models). De culture bi-culturelle, elle combine la sensibilité entrepreneuriale congolaise et la rigueur d''exécution allemande — exactement le pont que DBC Germany doit incarner entre les entreprises africaines et le marché DACH.

Vous aurez affaire à elle pour une candidature en incubation, un accord de sponsoring, ou pour que le volet allemand d''une édition de Richesses d''Afrique se concrétise.'
  WHERE slug = 'ruth-bambi';
