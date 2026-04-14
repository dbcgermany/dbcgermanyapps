-- Populate trilingual bio + LinkedIn for Jay N Kalala.
UPDATE public.team_members
  SET
    bio_en =
'Congolese-German entrepreneur, investor and speaker based in the Rhine-Ruhr region. At DBC Germany, Jay leads sales, sponsoring and the digital platform you are using right now — and is editorially responsible for the site under § 55 RStV.

He is the founder of Narikia (the studio that built dbc-germany.com and ticket.dbc-germany.com) and of BAFOD Group (media, design & development). Beyond DBC he builds and advises ventures across the Africa–Europe corridor: Monaluxe (retail, petroleum & logistics in the DR Congo), Champions Academy RDC (sports & youth development), Bossmetics (cosmetics), Gymosphere (gym-management SaaS), GrowthInvestHub (investment education) and Nexokay (B2B SaaS).

He writes and speaks on fintech, African entrepreneurship and building cross-border digital infrastructure.',
    bio_de =
'Kongolesisch-deutscher Unternehmer, Investor und Speaker mit Sitz im Rhein-Ruhr-Gebiet. Bei DBC Germany verantwortet Jay Vertrieb, Sponsoring und die digitale Plattform, die Sie gerade benutzen — und ist redaktionell verantwortlich im Sinne des § 55 RStV.

Er ist Gründer von Narikia (dem Studio, das dbc-germany.com und ticket.dbc-germany.com entwickelt hat) und von BAFOD Group (Media, Design & Entwicklung). Neben DBC baut und berät er Unternehmen im Afrika–Europa-Korridor: Monaluxe (Einzelhandel, Petroleum & Logistik in der DR Kongo), Champions Academy RDC (Sport & Jugendförderung), Bossmetics (Kosmetik), Gymosphere (Gym-Management-SaaS), GrowthInvestHub (Investment-Bildung) und Nexokay (B2B-SaaS).

Er schreibt und spricht über Fintech, afrikanisches Unternehmertum und den Aufbau grenzüberschreitender digitaler Infrastruktur.',
    bio_fr =
'Entrepreneur, investisseur et conférencier congolais-allemand basé dans la région Rhin-Ruhr. Chez DBC Germany, Jay dirige les ventes, le sponsoring et la plateforme numérique que vous utilisez actuellement — et est responsable éditorial du site au sens du § 55 RStV.

Il est le fondateur de Narikia (le studio qui a développé dbc-germany.com et ticket.dbc-germany.com) et de BAFOD Group (média, design & développement). Au-delà de DBC, il construit et conseille des entreprises dans le corridor Afrique–Europe : Monaluxe (commerce, pétrole & logistique en RD Congo), Champions Academy RDC (sport & jeunesse), Bossmetics (cosmétique), Gymosphere (SaaS de gestion de salles), GrowthInvestHub (éducation à l''investissement) et Nexokay (SaaS B2B).

Il écrit et intervient sur la fintech, l''entrepreneuriat africain et la construction d''infrastructures numériques transfrontalières.',
    linkedin_url = 'https://de.linkedin.com/in/realjaynka'
  WHERE slug = 'jay-n-kalala';
