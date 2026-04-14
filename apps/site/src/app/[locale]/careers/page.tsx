import type { Metadata } from "next";
import {
  Card,
  Container,
  Eyebrow,
  Heading,
  LinkButton,
  Section,
} from "@dbc/ui";

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
    type: { en: "Contract", de: "Freiberuflich", fr: "Freelance" },
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
    eyebrow: { en: "Careers", de: "Karriere", fr: "Carrières" }[l],
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
    apply: { en: "Apply", de: "Bewerben", fr: "Postuler" }[l],
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
    contact: { en: "Contact", de: "Kontakt", fr: "Contact" }[l],
  };

  return (
    <Section>
      <Container max="4xl">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-3">
          {copy.title}
        </Heading>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {copy.intro}
        </p>

        <div className="mt-14 space-y-4">
          {ROLES.map((r) => (
            <Card key={r.title.en}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Heading level={4}>{r.title[l]}</Heading>
                  <Eyebrow className="mt-1 text-muted-foreground">
                    {r.location} · {r.type[l]}
                  </Eyebrow>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {r.blurb[l]}
                  </p>
                </div>
                <LinkButton
                  size="sm"
                  href={`mailto:jay@dbc-germany.com?subject=${encodeURIComponent(
                    `Application: ${r.title.en}`
                  )}`}
                  className="shrink-0"
                >
                  {copy.apply}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-14 border-dashed bg-muted/30">
          <Heading level={4}>{copy.speculativeTitle}</Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.speculativeBody}
          </p>
          <LinkButton size="sm" href={`/${locale}/contact`} className="mt-4">
            {copy.contact}
          </LinkButton>
        </Card>
      </Container>
    </Section>
  );
}
