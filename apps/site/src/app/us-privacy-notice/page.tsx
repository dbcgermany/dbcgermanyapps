import type { Metadata } from "next";
import { getCompanyInfo, UsPrivacyNotice } from "@dbc/legal";

export const metadata: Metadata = {
  title: "US Privacy Notice — DBC Germany",
};

export default async function UsPrivacyNoticePage() {
  const company = await getCompanyInfo();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <UsPrivacyNotice
        company={company}
        privacyUrl="https://dbc-germany.com/en/privacy"
      />
    </div>
  );
}
