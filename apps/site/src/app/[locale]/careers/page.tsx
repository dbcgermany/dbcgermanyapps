import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "de"
        ? "Karriere"
        : locale === "fr"
          ? "Carrières"
          : "Careers",
  };
}

type Role = {
  title: { en: string; de: string; fr: string };
  location: string;
  type: { en: string; de: string; fr: string };
  blurb: { en: string; de: string; fr: string };
};

const ROLES: Role[] = [
  {
    title: {
      en: "Community & Partnerships Lead (DACH)",
      de: "Community- & Partnerschaften-Lead (DACH)",
      fr: "Responsable communauté & partenariats (DACH)",
    },
    location: "Düsseldorf / remote",
    type: {
      en: "Full-time",
      de: "Vollzeit",
      fr: "Temps plein",
    },
    blurb: {
      en: "Grow DBC Germany's presence with founder communities, incubators and investor networks across Germany, Austria, and Switzerland.",
      de: "Baue die Präsenz von DBC Germany in Gründer-Communities, Inkubatoren und Investor:innen-Netzwerken in Deutschland, Österreich und der Schweiz aus.",
      fr: "Développez la présence de DBC Germany auprès des communautés de fondateurs, incubateurs et réseaux d'investisseurs en Allemagne, Autriche et Suisse.",
    },
  },
  {
    title: {
      en: "Event Producer — Richesses d'Afrique 2026",
      de: "Event Producer — Richesses d'Afrique 2026",
      fr: "Event Producer — Richesses d'Afrique 2026",
    },
    location: "Essen (on-site, Q2 2026)",
    type: {
      en: "Contract",
      de: "Freiberuflich",
      fr: "Freelance",
    },
    blurb: {
      en: "Own the Essen production: venue, suppliers, run-of-show, crew. Must have produced a 500+ pax conference in DACH.",
      de: "Verantwortung für die Produktion in Essen: Location, Dienstleister, Regieplan, Crew. Erfahrung mit Konferenzen ab 500 TN in DACH erforderlich.",
      fr: "Pilotez la production à Essen : lieu, prestataires, conduite, équipes. Expérience requise de conférences 500+ pax en DACH.",
    },
  },
];

export default async function CareersPage({
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
      en: "Careers",
      de: "Karriere",
      fr: "Carrières",
    }[l],
    title: {
      en: "Work at DBC Germany.",
      de: "Arbeite bei DBC Germany.",
      fr: "Rejoindre DBC Germany.",
    }[l],
    intro: {
      en: "We're a lean team in Düsseldorf. Hands-on operators welcome. Strong preference for candidates with African roots or Francophone fluency.",
      de: "Wir sind ein schlankes Team in Düsseldorf. Praktische Macher:innen willkommen — bevorzugt mit afrikanischen Wurzeln oder französischen Sprachkenntnissen.",
      fr: "Équipe resserrée à Düsseldorf. Profils opérationnels bienvenus — une préférence pour les candidat·e·s aux racines africaines ou francophones.",
    }[l],
    apply: {
      en: "Apply",
      de: "Bewerben",
      fr: "Postuler",
    }[l],
    speculativeTitle: {
      en: "Don't see your role?",
      de: "Keine passende Rolle dabei?",
      fr: "Vous ne trouvez pas votre poste ?",
    }[l],
    speculativeBody: {
      en: "We always want to meet excellent operators. Send a short note on what you'd build with us.",
      de: "Wir lernen gerne exzellente Operator:innen kennen. Schreib uns kurz, was du mit uns aufbauen willst.",
      fr: "Nous rencontrons volontiers d'excellents opérationnels. Écrivez-nous ce que vous construiriez avec nous.",
    }[l],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
        {copy.intro}
      </p>

      <div className="mt-14 space-y-4">
        {ROLES.map((r) => (
          <article
            key={r.title.en}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-bold">
                  {r.title[l]}
                </h2>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {r.location} · {r.type[l]}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {r.blurb[l]}
                </p>
              </div>
              <a
                href={`mailto:jay@dbc-germany.com?subject=${encodeURIComponent(
                  `Application: ${r.title.en}`
                )}`}
                className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {copy.apply}
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-dashed border-border bg-muted/30 p-6">
        <h2 className="font-heading text-lg font-bold">
          {copy.speculativeTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.speculativeBody}
        </p>
        <Link
          href={`/${locale}/contact`}
          className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {l === "de" ? "Kontakt" : l === "fr" ? "Contact" : "Contact"}
        </Link>
      </div>
    </div>
  );
}
