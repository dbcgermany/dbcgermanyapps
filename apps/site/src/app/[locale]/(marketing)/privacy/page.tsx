import type { Metadata } from "next";
import {
  getCompanyInfo,
  PrivacyPolicy,
  LegalPageShell,
  type LegalLocale,
} from "@dbc/legal";
import { MaybeDbLegalDoc } from "@dbc/legal/server";

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
  const dbDoc = await MaybeDbLegalDoc({
    documentType: "privacy",
    company,
    locale: l,
    siteUrl: "https://dbc-germany.com",
    marketingSiteUrl: "https://dbc-germany.com",
    ticketsSiteUrl: "https://tickets.dbc-germany.com",
  });

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      {dbDoc ?? (
        <PrivacyPolicy
          company={company}
          locale={l}
          siteUrl="https://dbc-germany.com"
          marketingSiteUrl="https://dbc-germany.com"
          ticketsSiteUrl="https://tickets.dbc-germany.com"
        />
      )}
    </LegalPageShell>
  );
}
