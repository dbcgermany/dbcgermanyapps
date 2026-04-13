import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — DBC Germany Tickets",
};

const content: Record<string, { title: string; body: string }> = {
  en: {
    title: "Terms of Service",
    body: "These terms of service govern your use of the DBC Germany ticketing platform (ticket.dbc-germany.com). By purchasing tickets or using our services, you agree to these terms. Service provider: DBC Germany GmbH, Essen, Germany.",
  },
  de: {
    title: "Allgemeine Gesch\u00e4ftsbedingungen",
    body: "Diese Allgemeinen Gesch\u00e4ftsbedingungen regeln Ihre Nutzung der DBC Germany Ticketing-Plattform (ticket.dbc-germany.com). Mit dem Kauf von Tickets oder der Nutzung unserer Dienste stimmen Sie diesen Bedingungen zu. Dienstanbieter: DBC Germany GmbH, Essen, Deutschland.",
  },
  fr: {
    title: "Conditions g\u00e9n\u00e9rales d\u2019utilisation",
    body: "Les pr\u00e9sentes conditions g\u00e9n\u00e9rales r\u00e9gissent votre utilisation de la plateforme de billetterie DBC Germany (ticket.dbc-germany.com). En achetant des billets ou en utilisant nos services, vous acceptez ces conditions. Prestataire: DBC Germany GmbH, Essen, Allemagne.",
  },
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = content[locale] ?? content.en;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t.title}</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>{t.body}</p>
        {/* TODO: Replace with full legally-reviewed terms content */}
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm">
          Full terms of service will be added after legal review.
        </p>
      </div>
    </main>
  );
}
