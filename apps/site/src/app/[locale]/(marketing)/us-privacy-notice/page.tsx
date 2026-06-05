import type { Metadata } from "next";
import {
  getCompanyInfo,
  UsPrivacyNotice,
  LegalPageShell,
  type LegalLocale,
} from "@dbc/legal";

// ISR: reads company_info from the DB → follows the site's standard
// revalidate window (company-info saves also path-revalidate this route).
export const revalidate = 60;

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
          locale={l}
        />
    </LegalPageShell>
  );
}
