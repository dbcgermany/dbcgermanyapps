import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DBC Germany Tickets",
};

const content: Record<string, { title: string; body: string }> = {
  en: {
    title: "Privacy Policy",
    body: "This privacy policy explains how DBC Germany GmbH collects, uses, and protects your personal data in accordance with the EU General Data Protection Regulation (GDPR) and the German Federal Data Protection Act (BDSG). Data controller: DBC Germany GmbH, Essen, Germany. Supabase data is hosted in Frankfurt, EU.",
  },
  de: {
    title: "Datenschutzerkl\u00e4rung",
    body: "Diese Datenschutzerkl\u00e4rung erl\u00e4utert, wie DBC Germany GmbH Ihre personenbezogenen Daten gem\u00e4\u00df der EU-Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG) erhebt, verwendet und sch\u00fctzt. Verantwortlicher: DBC Germany GmbH, Essen, Deutschland. Supabase-Daten werden in Frankfurt, EU, gehostet.",
  },
  fr: {
    title: "Politique de confidentialit\u00e9",
    body: "Cette politique de confidentialit\u00e9 explique comment DBC Germany GmbH collecte, utilise et prot\u00e8ge vos donn\u00e9es personnelles conform\u00e9ment au R\u00e8glement g\u00e9n\u00e9ral sur la protection des donn\u00e9es (RGPD) et \u00e0 la loi f\u00e9d\u00e9rale allemande sur la protection des donn\u00e9es (BDSG). Responsable du traitement: DBC Germany GmbH, Essen, Allemagne.",
  },
};

export default async function PrivacyPage({
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
        {/* TODO: Replace with full legally-reviewed privacy policy content */}
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm">
          Full privacy policy content will be added after legal review.
        </p>
      </div>
    </main>
  );
}
