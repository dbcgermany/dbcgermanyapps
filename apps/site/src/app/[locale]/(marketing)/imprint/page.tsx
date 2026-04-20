import type { Metadata } from "next";
import { getCompanyInfo, Impressum, LegalPageShell, type LegalLocale } from "@dbc/legal";

const titles: Record<string, string> = {
  en: "Imprint — DBC Germany",
  de: "Impressum — DBC Germany",
  fr: "Mentions légales — DBC Germany",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] ?? titles.en };
}

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const company = await getCompanyInfo();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as LegalLocale;

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      <Impressum
        company={company}
        locale={l}
        siteUrl="https://dbc-germany.com"
        marketingSiteUrl="https://dbc-germany.com"
        ticketsSiteUrl="https://tickets.dbc-germany.com"
      />
    </LegalPageShell>
  );
}
