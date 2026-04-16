import type { Metadata } from "next";
import { getCompanyInfo, TermsOfService, type LegalLocale } from "@dbc/legal";

const titles: Record<string, string> = {
  en: "Terms of Service — DBC Germany",
  de: "AGB — DBC Germany",
  fr: "CGU — DBC Germany",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] ?? titles.en };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const company = await getCompanyInfo();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as LegalLocale;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <TermsOfService
        company={company}
        locale={l}
        siteUrl="https://dbc-germany.com"
        marketingSiteUrl="https://dbc-germany.com"
        ticketsSiteUrl="https://tickets.dbc-germany.com"
      />
    </div>
  );
}
