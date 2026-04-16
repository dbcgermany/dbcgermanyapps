import type { Metadata } from "next";
import { getCompanyInfo, CookiePolicy, LegalPageShell, type LegalLocale } from "@dbc/legal";

const titles: Record<string, string> = {
  en: "Cookie Policy — DBC Germany Tickets",
  de: "Cookie-Richtlinie — DBC Germany Tickets",
  fr: "Politique des cookies — DBC Germany Tickets",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] ?? titles.en };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const company = await getCompanyInfo();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as LegalLocale;

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      <CookiePolicy
        company={company}
        locale={l}
        siteUrl="https://tickets.dbc-germany.com"
        marketingSiteUrl="https://dbc-germany.com"
        ticketsSiteUrl="https://tickets.dbc-germany.com"
      />
    </LegalPageShell>
  );
}
