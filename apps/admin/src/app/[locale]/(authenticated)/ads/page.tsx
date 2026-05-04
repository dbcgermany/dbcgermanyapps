import { getTranslations } from "next-intl/server";
import { requireRole } from "@dbc/supabase/server";
import { listDashboardAds } from "@/actions/dashboard-ads";
import { PageHeader } from "@/components/page-header";
import { AdsClient } from "./ads-client";

export default async function AdsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole("super_admin");
  const ads = await listDashboardAds();

  const t = await getTranslations({ locale, namespace: "admin.ads.page" });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdsClient locale={locale} initialAds={ads} />
    </div>
  );
}
