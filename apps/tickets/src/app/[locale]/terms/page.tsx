import type { Metadata } from "next";
import {
  getCompanyInfo,
  TermsOfService,
  LegalPageShell,
  type LegalLocale,
} from "@dbc/legal";
import { MaybeDbLegalDoc } from "@dbc/legal/server";

const titles: Record<string, string> = {
  en: "Terms of Service — DBC Germany Tickets",
  de: "AGB — DBC Germany Tickets",
  fr: "CGU — DBC Germany Tickets",
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

  const dbDoc = await MaybeDbLegalDoc({
    documentType: "terms",
    company,
    locale: l,
    siteUrl: "https://tickets.dbc-germany.com",
    marketingSiteUrl: "https://dbc-germany.com",
    ticketsSiteUrl: "https://tickets.dbc-germany.com",
  });

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      {dbDoc ?? (
        <TermsOfService
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
