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
        ? "Allgemeine Geschäftsbedingungen"
        : locale === "fr"
          ? "Conditions générales"
          : "Terms of Service",
  };
}

const CONTENT = {
  en: {
    title: "Terms of Service",
    updated: "Last updated",
    date: "April 13, 2026",
    sections: [
      {
        heading: "Acceptance",
        body: "By using dbc-germany.com, ticket.dbc-germany.com or admin.dbc-germany.com you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.",
      },
      {
        heading: "Services",
        body: "DBC Germany provides incubation, courses, investments, mentorship and events. Some are contract-based (cohorts, sponsorships), others are one-time purchases (event tickets) or free resources. Each program has its own conditions, communicated at sign-up.",
      },
      {
        heading: "Tickets",
        body: "Tickets are non-refundable after the event has started or within 7 days of the event, unless required by law. Transfers are allowed up to 48 hours before the event. Each ticket is valid for one person and must be presented with a matching ID.",
      },
      {
        heading: "Payments",
        body: "Payments are processed by Stripe. We do not store full card numbers. All prices are in EUR and include VAT where applicable.",
      },
      {
        heading: "User conduct",
        body: "Do not scrape, attempt to bypass rate limits, resell tickets, or misuse the service. We may suspend accounts that violate these Terms.",
      },
      {
        heading: "Liability",
        body: "DBC Germany's liability is limited to the fees paid for the affected service, except where liability cannot be excluded by law.",
      },
      {
        heading: "Governing law",
        body: "German law applies. Place of jurisdiction: Düsseldorf.",
      },
    ],
  },
  de: {
    title: "Allgemeine Geschäftsbedingungen",
    updated: "Zuletzt aktualisiert",
    date: "13. April 2026",
    sections: [
      {
        heading: "Zustimmung",
        body: "Mit der Nutzung von dbc-germany.com, ticket.dbc-germany.com oder admin.dbc-germany.com stimmen Sie diesen AGB und unserer Datenschutzerklärung zu. Wenn Sie nicht zustimmen, nutzen Sie den Dienst bitte nicht.",
      },
      {
        heading: "Leistungen",
        body: "DBC Germany bietet Inkubation, Kurse, Investitionen, Mentoring und Veranstaltungen an. Einzelne Programme haben spezifische Bedingungen, die bei der Anmeldung kommuniziert werden.",
      },
      {
        heading: "Tickets",
        body: "Tickets sind ab Beginn der Veranstaltung bzw. innerhalb von 7 Tagen vor Veranstaltungsbeginn nicht erstattungsfähig, soweit gesetzlich zulässig. Übertragungen sind bis 48 Stunden vor der Veranstaltung möglich. Jedes Ticket gilt für eine Person und ist mit passendem Ausweis vorzulegen.",
      },
      {
        heading: "Zahlungen",
        body: "Zahlungen werden über Stripe abgewickelt. Wir speichern keine vollständigen Kartendaten. Alle Preise in EUR, inkl. ges. MwSt. soweit anwendbar.",
      },
      {
        heading: "Nutzerverhalten",
        body: "Kein Scraping, kein Umgehen von Rate-Limits, kein Weiterverkauf von Tickets, kein Missbrauch. Bei Verstößen können wir Konten sperren.",
      },
      {
        heading: "Haftung",
        body: "Die Haftung der DBC Germany ist auf die für die betroffene Leistung entrichteten Gebühren begrenzt, außer in Fällen, in denen eine Haftung gesetzlich nicht ausgeschlossen werden kann.",
      },
      {
        heading: "Recht",
        body: "Es gilt deutsches Recht. Gerichtsstand: Düsseldorf.",
      },
    ],
  },
  fr: {
    title: "Conditions générales",
    updated: "Dernière mise à jour",
    date: "13 avril 2026",
    sections: [
      {
        heading: "Acceptation",
        body: "L'utilisation de dbc-germany.com, ticket.dbc-germany.com ou admin.dbc-germany.com vaut acceptation des présentes CGU et de notre Politique de confidentialité.",
      },
      {
        heading: "Services",
        body: "DBC Germany propose incubation, formations, investissements, mentorat et événements. Chaque programme a ses conditions propres, communiquées à l'inscription.",
      },
      {
        heading: "Billets",
        body: "Les billets ne sont pas remboursables une fois l'événement commencé ou dans les 7 jours précédant l'événement, sauf obligation légale. Transferts possibles jusqu'à 48 h avant. Chaque billet est valable pour une personne et doit être présenté avec une pièce d'identité concordante.",
      },
      {
        heading: "Paiements",
        body: "Les paiements sont traités par Stripe. Nous ne stockons pas les numéros de carte complets. Prix en EUR, TVA incluse le cas échéant.",
      },
      {
        heading: "Conduite",
        body: "Pas de scraping, pas de contournement de limites de débit, pas de revente de billets, pas d'usage abusif. Les comptes contrevenants peuvent être suspendus.",
      },
      {
        heading: "Responsabilité",
        body: "La responsabilité de DBC Germany est limitée au montant payé pour le service concerné, sauf lorsque la loi l'interdit.",
      },
      {
        heading: "Droit applicable",
        body: "Droit allemand. Juridiction compétente : Düsseldorf.",
      },
    ],
  },
} as const;

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const content = CONTENT[locale as keyof typeof CONTENT] ?? CONTENT.en;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="text-xs text-muted-foreground">
        {content.updated}: {content.date}
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {content.title}
      </h1>
      <div className="mt-10 space-y-8">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl font-bold">{section.heading}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
