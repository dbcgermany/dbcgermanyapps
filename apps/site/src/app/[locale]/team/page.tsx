import Image from "next/image";
import type { Metadata } from "next";
import { Card, Container, Eyebrow, Heading, Section } from "@dbc/ui";
import { DBC } from "@/lib/dbc-assets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "de" ? "Team" : locale === "fr" ? "Équipe" : "Team",
  };
}

type Member = {
  name: string;
  role: { en: string; de: string; fr: string };
  bio: { en: string; de: string; fr: string };
  photo?: string;
  email?: string;
};

const TEAM: Member[] = [
  {
    name: "Dr. Jean-Clément Diambilay",
    role: {
      en: "Founder · DBC Group",
      de: "Gründer · DBC Group",
      fr: "Fondateur · DBC Group",
    },
    bio: {
      en: "Founder of Diambilay Business Center (Lubumbashi) and of the DBC France SAS. Drives the DBC vision to raise a generation of prosperous African entrepreneurs.",
      de: "Gründer des Diambilay Business Center (Lubumbashi) und der DBC France SAS. Treibt die DBC-Vision voran, eine Generation erfolgreicher afrikanischer Unternehmer:innen aufzubauen.",
      fr: "Fondateur du Diambilay Business Center (Lubumbashi) et de DBC France SAS. Porte la vision DBC d'élever une génération d'entrepreneurs africains prospères.",
    },
    photo: DBC.photo.mentorship,
  },
  {
    name: "Ruth Bambi",
    role: {
      en: "Project Manager · Germany CEO",
      de: "Projektleiterin · Germany CEO",
      fr: "Chef de projet · Germany CEO",
    },
    bio: {
      en: "Leads DBC Germany day-to-day. Single point of contact for German partners, sponsors, and DACH entrepreneurs joining DBC programmes.",
      de: "Leitet das Tagesgeschäft von DBC Germany. Ansprechpartnerin für deutsche Partner, Sponsoren und DACH-Gründer:innen, die an DBC-Programmen teilnehmen.",
      fr: "Dirige le quotidien de DBC Germany. Point de contact pour les partenaires allemands, sponsors et entrepreneurs DACH rejoignant les programmes DBC.",
    },
    photo: DBC.photo.team,
  },
  {
    name: "Jay N Kalala",
    role: {
      en: "Sales & Sponsorship Lead · V.i.S.d.P.",
      de: "Sales- & Sponsoring-Lead · V.i.S.d.P.",
      fr: "Responsable ventes & sponsoring · V.i.S.d.P.",
    },
    bio: {
      en: "Heads sponsorship for Richesses d'Afrique Essen 2026 and oversees the digital platforms (dbc-germany.com + ticket.dbc-germany.com). Editorially responsible for site content per § 55 RStV.",
      de: "Verantwortet das Sponsoring für Richesses d'Afrique Essen 2026 und die digitalen Plattformen (dbc-germany.com + ticket.dbc-germany.com). Redaktionell verantwortlich gemäß § 55 RStV.",
      fr: "Responsable du sponsoring de Richesses d'Afrique Essen 2026 et des plateformes numériques (dbc-germany.com + ticket.dbc-germany.com). Responsable éditorial selon § 55 RStV.",
    },
    photo: DBC.photo.cohort,
    email: "jay@dbc-germany.com",
  },
];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const copy = {
    eyebrow: {
      en: "The people behind DBC Germany",
      de: "Das Team hinter DBC Germany",
      fr: "L'équipe DBC Germany",
    }[l],
    title: {
      en: "A DACH team, tightly linked to DBC International.",
      de: "Ein DACH-Team, eng verbunden mit DBC International.",
      fr: "Une équipe DACH, étroitement liée à DBC International.",
    }[l],
    intro: {
      en: "We're a small team in Düsseldorf connecting DBC's programmes, investments, and events to founders in Germany, Austria, and Switzerland.",
      de: "Wir sind ein kleines Team in Düsseldorf, das die Programme, Investitionen und Veranstaltungen von DBC an Gründer:innen in Deutschland, Österreich und der Schweiz bringt.",
      fr: "Nous sommes une petite équipe à Düsseldorf, qui relie les programmes, investissements et événements DBC aux entrepreneurs d'Allemagne, d'Autriche et de Suisse.",
    }[l],
  };

  return (
    <Section>
      <Container max="5xl">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-3">
          {copy.title}
        </Heading>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {copy.intro}
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TEAM.map((m) => (
            <Card key={m.name} padding="none" className="overflow-hidden">
              {m.photo && (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <Image
                    src={m.photo}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-6">
                <Heading level={4}>{m.name}</Heading>
                <Eyebrow className="mt-1">{m.role[l]}</Eyebrow>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {m.bio[l]}
                </p>
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    {m.email}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
