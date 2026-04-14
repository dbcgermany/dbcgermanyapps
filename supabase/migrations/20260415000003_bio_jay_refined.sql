-- Refine Jay's bio with accurate descriptions of Champion's Academy RDC and Bossmetics.
UPDATE public.team_members
  SET
    bio_en =
'Congolese-German entrepreneur, investor and speaker based in the Rhine-Ruhr region. At DBC Germany, Jay leads sales, sponsoring and the digital platform you are using right now — and is editorially responsible for the site under § 55 RStV.

He is the founder of Narikia (the studio that built dbc-germany.com and ticket.dbc-germany.com) and of BAFOD Group (media, design & development). Beyond DBC he builds and advises ventures across the Africa–Europe corridor:

• Champion''s Academy RDC — a premier combat-sports and fitness institution in Kinshasa (boxing, kickboxing, MMA, taekwondo).
• Bossmetics — an all-in-one SaaS platform for beauty professionals (booking, client records, payments, analytics).
• Monaluxe — retail, petroleum and logistics in the DR Congo.
• Gymosphere — gym-management SaaS.
• GrowthInvestHub — investment education.
• Nexokay — B2B SaaS suite.

He writes and speaks on fintech, African entrepreneurship and building cross-border digital infrastructure.',
    bio_de =
'Kongolesisch-deutscher Unternehmer, Investor und Speaker mit Sitz im Rhein-Ruhr-Gebiet. Bei DBC Germany verantwortet Jay Vertrieb, Sponsoring und die digitale Plattform, die Sie gerade benutzen — und ist redaktionell verantwortlich im Sinne des § 55 RStV.

Er ist Gründer von Narikia (dem Studio, das dbc-germany.com und ticket.dbc-germany.com entwickelt hat) und von BAFOD Group (Media, Design & Entwicklung). Über DBC hinaus baut und berät er Unternehmen im Afrika–Europa-Korridor:

• Champion''s Academy RDC — führende Kampfsport- und Fitnessinstitution in Kinshasa (Boxen, Kickboxen, MMA, Taekwondo).
• Bossmetics — All-in-One-SaaS-Plattform für Beauty-Professionals (Buchung, Kundenakten, Zahlungen, Analytics).
• Monaluxe — Einzelhandel, Petroleum und Logistik in der DR Kongo.
• Gymosphere — SaaS für Gym-Management.
• GrowthInvestHub — Investment-Bildung.
• Nexokay — B2B-SaaS-Suite.

Er schreibt und spricht über Fintech, afrikanisches Unternehmertum und den Aufbau grenzüberschreitender digitaler Infrastruktur.',
    bio_fr =
'Entrepreneur, investisseur et conférencier congolais-allemand basé dans la région Rhin-Ruhr. Chez DBC Germany, Jay dirige les ventes, le sponsoring et la plateforme numérique que vous utilisez actuellement — et est responsable éditorial du site au sens du § 55 RStV.

Il est le fondateur de Narikia (le studio qui a développé dbc-germany.com et ticket.dbc-germany.com) et de BAFOD Group (média, design & développement). Au-delà de DBC, il construit et conseille des entreprises dans le corridor Afrique–Europe :

• Champion''s Academy RDC — institution de référence en sports de combat et fitness à Kinshasa (boxe, kick-boxing, MMA, taekwondo).
• Bossmetics — plateforme SaaS tout-en-un pour les professionnels de la beauté (réservation, fiches clients, paiements, analytics).
• Monaluxe — commerce, pétrole et logistique en RD Congo.
• Gymosphere — SaaS de gestion de salles de sport.
• GrowthInvestHub — éducation à l''investissement.
• Nexokay — suite SaaS B2B.

Il écrit et intervient sur la fintech, l''entrepreneuriat africain et la construction d''infrastructures numériques transfrontalières.'
  WHERE slug = 'jay-n-kalala';
