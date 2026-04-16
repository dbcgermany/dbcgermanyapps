import type { Metadata } from "next";
import { getCompanyInfo, UsPrivacyNotice, LegalPageShell } from "@dbc/legal";

export const metadata: Metadata = {
  title: "US Privacy Notice — DBC Germany",
};

export default async function UsPrivacyNoticePage() {
  const company = await getCompanyInfo();

  return (
    <LegalPageShell locale="en" homeHref="/en">
      <UsPrivacyNotice
        company={company}
        privacyUrl="https://dbc-germany.com/en/privacy"
      />
    </LegalPageShell>
  );
}
