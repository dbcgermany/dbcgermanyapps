import Image from "next/image";
import type { Metadata } from "next";
import { Card, Container, Eyebrow, Heading, Reveal, Section } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";
import { DBC } from "@/lib/dbc-assets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/press", pageKey: "press" });
}

export default async function PressPage({
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
    eyebrow: { en: "Press", de: "Presse", fr: "Presse" }[l],
    title: {
      en: "Covering DBC Germany or Richesses d'Afrique 2026?",
      de: "Berichten Sie über DBC Germany oder Richesses d'Afrique 2026?",
      fr: "Vous couvrez DBC Germany ou Richesses d'Afrique 2026 ?",
    }[l],
    intro: {
      en: "Thank you. Below are verified facts, visuals and contacts for journalists, analysts, and partners.",
      de: "Danke. Hier finden Sie geprüfte Fakten, Bildmaterial und Kontakte für Journalist:innen, Analyst:innen und Partner.",
      fr: "Merci. Retrouvez ici des faits vérifiés, des visuels et des contacts pour journalistes, analystes et partenaires.",
    }[l],
    factsTitle: {
      en: "Key facts",
      de: "Eckdaten",
      fr: "Données clés",
    }[l],
    logoKitTitle: {
      en: "Logo & visual assets",
      de: "Logo & Visuals",
      fr: "Logo & visuels",
    }[l],
    logoKitBody: {
      en: "DBC brand mark, high-resolution event photography and product screenshots. Tag @DBCGermany when using on social. Request extended assets by email.",
      de: "DBC-Logo, hochauflösende Event-Fotografie und Produkt-Screenshots. Bitte mit @DBCGermany verlinken. Erweiterte Materialien auf Anfrage per E-Mail.",
      fr: "Logo DBC, photos HD d'événements et captures produit. Merci de créditer @DBCGermany. Sur demande pour les visuels étendus.",
    }[l],
    contactTitle: {
      en: "Press contact",
      de: "Pressekontakt",
      fr: "Contact presse",
    }[l],
    contactBody: {
      en: "Jay N Kalala — Sales & Sponsorship Lead. Responds within 24 hours on weekdays.",
      de: "Jay N Kalala — Sales & Sponsoring. Antwortet werktags innerhalb von 24 Stunden.",
      fr: "Jay N Kalala — Ventes & sponsoring. Réponse sous 24 h en semaine.",
    }[l],
  };

  const facts = [
    {
      label: {
        en: "Parent organisation",
        de: "Muttergesellschaft",
        fr: "Organisation mère",
      }[l],
      value: "Diambilay Business Center · Lubumbashi, DR Congo · 2021",
    },
    {
      label: { en: "France entity", de: "Einheit Frankreich", fr: "Entité France" }[l],
      value: "DBC France SAS · SIREN 940 839 145 · Herblay-sur-Seine · 2025",
    },
    {
      label: {
        en: "Germany entity",
        de: "Einheit Deutschland",
        fr: "Entité Allemagne",
      }[l],
      value: "DBC Germany (UG i.G.) · Düsseldorf · 2026",
    },
    {
      label: { en: "Startups accompanied", de: "Begleitete Startups", fr: "Startups accompagnées" }[l],
      value: "213",
    },
    {
      label: { en: "Satisfied clients", de: "Zufriedene Kund:innen", fr: "Clients satisfaits" }[l],
      value: "275",
    },
    {
      label: {
        en: "Flagship 2026 event",
        de: "Flagship-Event 2026",
        fr: "Événement phare 2026",
      }[l],
      value: "Richesses d'Afrique · 13 June 2026 · Essen, Germany",
    },
  ];

  return (
    <Section>
      <Container max="4xl">
        <Reveal>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Heading level={1} className="mt-3">
            {copy.title}
          </Heading>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {copy.intro}
          </p>
        </Reveal>

        <div className="mt-14">
          <Reveal><Heading level={2}>{copy.factsTitle}</Heading></Reveal>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {facts.map((f, i) => (
              <Reveal key={f.label} delay={Math.min(i, 5) * 50} className="h-full">
              <Card padding="md">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="mt-2 text-base font-semibold text-foreground">
                  {f.value}
                </dd>
              </Card>
              </Reveal>
            ))}
          </dl>
        </div>

        <div className="mt-14">
          <Reveal>
          <Heading level={2}>{copy.logoKitTitle}</Heading>
          <p className="mt-3 text-muted-foreground">{copy.logoKitBody}</p>
          <Card className="mt-6 flex items-center gap-6">
            <Image
              src={DBC.logo}
              alt="DBC"
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col gap-2">
              <a
                href={DBC.logo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
              >
                {l === "de"
                  ? "Logo (PNG) öffnen"
                  : l === "fr"
                    ? "Ouvrir le logo (PNG)"
                    : "Open logo (PNG)"}
                <span aria-hidden>↗</span>
              </a>
              <a
                href={`mailto:jay@dbc-germany.com?subject=${encodeURIComponent("DBC press assets request")}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {l === "de"
                  ? "Erweiterte Materialien anfragen"
                  : l === "fr"
                    ? "Demander les visuels étendus"
                    : "Request extended assets"}
              </a>
            </div>
          </Card>
          </Reveal>
        </div>

        <div className="mt-14">
          <Reveal>
          <Heading level={2}>{copy.contactTitle}</Heading>
          <p className="mt-3 text-muted-foreground">{copy.contactBody}</p>
          <p className="mt-4">
            <a
              href="mailto:jay@dbc-germany.com"
              className="text-primary hover:text-primary/80"
            >
              jay@dbc-germany.com
            </a>
          </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
