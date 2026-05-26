import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAffiliateDashboardByToken } from "@dbc/affiliate/server";
import type { Locale } from "@dbc/types";
import { PartnerDashboard, PartnerEndedScreen } from "./partner-dashboard";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: rawLocale, token } = await params;
  const locale = (["en", "de", "fr"].includes(rawLocale) ? rawLocale : "en") as Locale;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const result = await getAffiliateDashboardByToken(
    supabase,
    token,
    locale as "en" | "de" | "fr"
  );

  if (result.kind === "not_found") notFound();
  if (result.kind === "disabled") notFound();
  if (result.kind === "expired" || result.kind === "revoked") {
    return <PartnerEndedScreen kind={result.kind} locale={locale as "en" | "de" | "fr"} />;
  }
  return <PartnerDashboard data={result.data} locale={locale as "en" | "de" | "fr"} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const title =
    locale === "de"
      ? "Partner-Dashboard"
      : locale === "fr"
      ? "Tableau de bord partenaire"
      : "Partner dashboard";
  return {
    title: `${title} · DBC Germany`,
    robots: { index: false, follow: false },
  };
}
