import type { Metadata } from "next";
import { getCompanyInfo, UsPrivacyNotice, LegalPageShell, type LegalLocale } from "@dbc/legal";

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

  return (
    <LegalPageShell locale={l} homeHref={`/${locale}`}>
      <UsPrivacyNotice
        company={company}
        privacyUrl={`https://dbc-germany.com/${locale}/privacy`}
      />
    </LegalPageShell>
  );
}
