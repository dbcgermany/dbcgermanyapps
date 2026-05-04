import type { Metadata } from "next";
import {
  getCompanyInfo,
  PrivacyPolicy,
  LegalPageShell,
  MaybeDbLegalDoc,
  type LegalLocale,
} from "@dbc/legal";

const titles: Record<string, string> = {
  en: "Privacy Policy — DBC Germany Tickets",
  de: "Datenschutzerklärung — DBC Germany Tickets",
  fr: "Politique de confidentialité — DBC Germany Tickets",
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

  const dbDoc = await MaybeDbLegalDoc({
    documentType: "privacy",
    company,
    locale: l,
    siteUrl: "https://tickets.dbc-germany.com",
    marketingSiteUrl: "https://dbc-germany.com",
    ticketsSiteUrl: "https://tickets.dbc-germany.com",
  });

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      {dbDoc ?? (
        <PrivacyPolicy
          company={company}
          locale={l}
          siteUrl="https://tickets.dbc-germany.com"
          marketingSiteUrl="https://dbc-germany.com"
          ticketsSiteUrl="https://tickets.dbc-germany.com"
        />
      )}
    </LegalPageShell>
  );
}
