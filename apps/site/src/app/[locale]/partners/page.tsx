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
        ? "Partner & Sponsoring"
        : locale === "fr"
          ? "Partenaires & sponsoring"
          : "Partners & sponsorship",
  };
}

type Tier = {
  name: { en: string; de: string; fr: string };
  price: string;
  deliverables: { en: string; de: string; fr: string }[];
};

const TIERS: Tier[] = [
  {
    name: { en: "Platinum", de: "Platin", fr: "Platine" },
    price: "€25 000",
    deliverables: [
      {
        en: 'Named stage: "<Your brand> Opening Keynote"',
        de: 'Named Stage: "<Ihre Marke> Opening Keynote"',
        fr: "Scène parrainée : « <Votre marque> Opening Keynote »",
      },
      {
        en: "10-minute executive slot on the main stage",
        de: "10-minütiger Slot auf der Hauptbühne",
        fr: "Créneau de 10 min sur la scène principale",
      },
      {
        en: "15 VIP passes · dedicated branded lounge",
        de: "15 VIP-Pässe · dedizierte Marken-Lounge",
        fr: "15 pass VIP · lounge de marque dédié",
      },
      {
        en: "Top placement on posters, site, and programme",
        de: "Top-Platzierung auf Postern, Website und Programm",
        fr: "Placement top sur affiches, site et programme",
      },
    ],
  },
  {
    name: { en: "Gold", de: "Gold", fr: "Or" },
    price: "€12 000",
    deliverables: [
      {
        en: "Panel sponsorship · named masterclass room",
        de: "Panel-Sponsoring · benannter Masterclass-Raum",
        fr: "Sponsoring d'un panel · salle masterclass nommée",
      },
      {
        en: "8 VIP passes · co-branded networking reception",
        de: "8 VIP-Pässe · gemeinsamer Networking-Empfang",
        fr: "8 pass VIP · réception de networking co-brandée",
      },
      {
        en: "Full-page feature in the event programme",
        de: "Ganzseitige Präsenz im Event-Programm",
        fr: "Page complète dans le programme de l'événement",
      },
    ],
  },
  {
    name: { en: "Silver", de: "Silber", fr: "Argent" },
    price: "€5 000",
    deliverables: [
      {
        en: "Branded booth in the exhibitor hall",
        de: "Gebrandeter Stand in der Ausstellerhalle",
        fr: "Stand de marque dans la zone exposants",
      },
      { en: "4 VIP passes", de: "4 VIP-Pässe", fr: "4 pass VIP" },
      {
        en: "Logo on site, posters, programme",
        de: "Logo auf Website, Postern, Programm",
        fr: "Logo sur site, affiches, programme",
      },
    ],
  },
  {
    name: { en: "Community", de: "Community", fr: "Communauté" },
    price: "€1 500",
    deliverables: [
      {
        en: "2 VIP passes + dedicated seat block for your team",
        de: "2 VIP-Pässe + reservierter Sitzblock für Ihr Team",
        fr: "2 pass VIP + bloc de sièges dédié à votre équipe",
      },
      {
        en: "Logo on the partner wall and programme",
        de: "Logo auf der Partnerwand und im Programm",
        fr: "Logo sur le mur partenaires et dans le programme",
      },
    ],
  },
];

export default async function PartnersPage({
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
      en: "Partners & sponsorship",
      de: "Partner & Sponsoring",
      fr: "Partenaires & sponsoring",
    }[l],
    title: {
      en: "Back Richesses d'Afrique Essen 2026.",
      de: "Unterstützen Sie Richesses d'Afrique Essen 2026.",
      fr: "Soutenez Richesses d'Afrique Essen 2026.",
    }[l],
    intro: {
      en: "Reach 950+ founders, investors and executives with African focus on June 13, 2026 in Essen. All packages are customisable; the tiers below are starting points.",
      de: "Erreichen Sie am 13. Juni 2026 in Essen 950+ Gründer:innen, Investor:innen und Führungskräfte mit Afrika-Fokus. Alle Pakete sind anpassbar, die unten gezeigten Stufen sind Startpunkte.",
      fr: "Touchez 950+ fondateurs, investisseurs et cadres à focus africain le 13 juin 2026 à Essen. Tous les packages sont personnalisables ; les paliers ci-dessous sont indicatifs.",
    }[l],
    cta: {
      en: "Request the sponsor deck",
      de: "Sponsoring-Deck anfragen",
      fr: "Demander le dossier sponsor",
    }[l],
    contact: { en: "Contact", de: "Kontakt", fr: "Contact" }[l],
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

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {TIERS.map((tier) => (
            <Card key={tier.name.en} className="flex flex-col">
              <div className="flex items-baseline justify-between">
                <Heading level={3}>{tier.name[l]}</Heading>
                <p className="font-heading text-xl font-bold text-primary">
                  {tier.price}
                </p>
              </div>
              <ul className="mt-6 space-y-2">
                {tier.deliverables.map((d) => (
                  <li key={d.en} className="flex gap-2 text-sm leading-6">
                    <span
                      aria-hidden
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span className="text-foreground">{d[l]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <LinkButton
            href={`mailto:jay@dbc-germany.com?subject=${encodeURIComponent(
              "Richesses d'Afrique 2026 sponsorship"
            )}`}
          >
            {copy.cta}
          </LinkButton>
          <LinkButton href={`/${locale}/contact`} variant="secondary">
            {copy.contact}
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}
