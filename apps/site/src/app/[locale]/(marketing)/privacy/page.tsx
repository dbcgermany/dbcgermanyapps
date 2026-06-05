import type { Metadata } from "next";
import {
  getCompanyInfo,
  PrivacyPolicy,
  LegalPageShell,
  type LegalLocale,
} from "@dbc/legal";

// ISR: reads company_info from the DB → follows the site's standard
// revalidate window (company-info saves also path-revalidate this route).
export const revalidate = 60;

const titles: Record<string, string> = {
  en: "Privacy Policy — DBC Germany",
  de: "Datenschutzerklärung — DBC Germany",
  fr: "Politique de confidentialité — DBC Germany",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] ?? titles.en };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const company = await getCompanyInfo();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as LegalLocale;

  // Try the DB-published version first; if the admin has never published
  // anything, fall back to the JSX component baked into @dbc/legal.
  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      <PrivacyPolicy
          company={company}
          locale={l}
          siteUrl="https://dbc-germany.com"
          marketingSiteUrl="https://dbc-germany.com"
          ticketsSiteUrl="https://tickets.dbc-germany.com"
        />
    </LegalPageShell>
  );
}
