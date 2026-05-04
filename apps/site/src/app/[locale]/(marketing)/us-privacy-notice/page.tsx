import type { Metadata } from "next";
import {
  getCompanyInfo,
  UsPrivacyNotice,
  LegalPageShell,
  type LegalLocale,
} from "@dbc/legal";
import { MaybeDbLegalDoc } from "@dbc/legal/server";

export const metadata: Metadata = {
  title: "US Privacy Notice — DBC Germany",
};

export default async function UsPrivacyNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const company = await getCompanyInfo();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as LegalLocale;

  const dbDoc = await MaybeDbLegalDoc({
    documentType: "us_privacy_notice",
    company,
    locale: l,
    siteUrl: "https://dbc-germany.com",
    marketingSiteUrl: "https://dbc-germany.com",
    ticketsSiteUrl: "https://tickets.dbc-germany.com",
  });

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      {dbDoc ?? (
        <UsPrivacyNotice
          company={company}
          privacyUrl={`https://dbc-germany.com/${locale}/privacy`}
          locale={l}
        />
      )}
    </LegalPageShell>
  );
}
