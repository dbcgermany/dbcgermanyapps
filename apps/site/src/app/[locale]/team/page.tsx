import Image from "next/image";
import type { Metadata } from "next";
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
    eyebrow:
      l === "de"
        ? "Das Team hinter DBC Germany"
        : l === "fr"
          ? "L'équipe DBC Germany"
          : "The people behind DBC Germany",
    title:
      l === "de"
        ? "Ein DACH-Team, eng verbunden mit DBC International."
        : l === "fr"
          ? "Une équipe DACH, étroitement liée à DBC International."
          : "A DACH team, tightly linked to DBC International.",
    intro:
      l === "de"
        ? "Wir sind ein kleines Team in Düsseldorf, das die Programme, Investitionen und Veranstaltungen von DBC an Gründer:innen in Deutschland, Österreich und der Schweiz bringt."
        : l === "fr"
          ? "Nous sommes une petite équipe à Düsseldorf, qui relie les programmes, investissements et événements DBC aux entrepreneurs d'Allemagne, d'Autriche et de Suisse."
          : "We're a small team in Düsseldorf connecting DBC's programmes, investments, and events to founders in Germany, Austria, and Switzerland.",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
        {copy.intro}
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TEAM.map((m) => (
          <article
            key={m.name}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
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
              <h2 className="font-heading text-lg font-bold">{m.name}</h2>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-primary">
                {m.role[l]}
              </p>
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
          </article>
        ))}
      </div>
    </div>
  );
}
