import type { Metadata } from "next";
import { Card, Container, Eyebrow, Heading, Section } from "@dbc/ui";

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
  initials: string;
  accent: "primary" | "accent" | "muted";
  role: { en: string; de: string; fr: string };
  bio: { en: string; de: string; fr: string };
  email?: string;
};

const TEAM: Member[] = [
  {
    name: "Dr. Jean-Clément Diambilay",
    initials: "JCD",
    accent: "primary",
    role: {
      en: "Founder · DBC Group",
      de: "Gründer · DBC Group",
      fr: "Fondateur · DBC Group",
    },
    bio: {
      en: "Founder of Diambilay Business Center (Lubumbashi) and of DBC France SAS. Drives the DBC vision to raise a generation of prosperous African entrepreneurs.",
      de: "Gründer des Diambilay Business Center (Lubumbashi) und der DBC France SAS. Treibt die DBC-Vision voran, eine Generation erfolgreicher afrikanischer Unternehmer:innen aufzubauen.",
      fr: "Fondateur du Diambilay Business Center (Lubumbashi) et de DBC France SAS. Porte la vision DBC d'élever une génération d'entrepreneurs africains prospères.",
    },
  },
  {
    name: "Ruth Bambi",
    initials: "RB",
    accent: "accent",
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
  },
  {
    name: "Jay N Kalala",
    initials: "JK",
    accent: "muted",
    role: {
      en: "Sales & Sponsorship Lead · V.i.S.d.P.",
      de: "Sales- & Sponsoring-Lead · V.i.S.d.P.",
      fr: "Responsable ventes & sponsoring · V.i.S.d.P.",
    },
    bio: {
      en: "Heads sponsorship for Richesses d'Afrique Essen 2026 and oversees the digital platforms. Editorially responsible for site content per § 55 RStV.",
      de: "Verantwortet das Sponsoring für Richesses d'Afrique Essen 2026 und die digitalen Plattformen. Redaktionell verantwortlich gemäß § 55 RStV.",
      fr: "Responsable du sponsoring de Richesses d'Afrique Essen 2026 et des plateformes numériques. Responsable éditorial selon § 55 RStV.",
    },
    email: "jay@dbc-germany.com",
  },
];

function accentClasses(a: Member["accent"]) {
  if (a === "primary")
    return "bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 text-primary";
  if (a === "accent")
    return "bg-gradient-to-br from-accent/30 via-accent/15 to-primary/20 text-accent";
  return "bg-gradient-to-br from-muted via-muted/60 to-background text-foreground";
}

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
            <Card key={m.name} className="flex flex-col items-start">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full font-heading text-2xl font-bold ${accentClasses(
                  m.accent
                )}`}
                aria-hidden
              >
                {m.initials}
              </div>
              <Heading level={4} className="mt-5">
                {m.name}
              </Heading>
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
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
