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

  const T = {
    en: {
      title: "Dashboard ads",
      description:
        "Sponsored banner rotator shown at the top of the admin dashboard. Only super admins can edit.",
    },
    de: {
      title: "Dashboard-Anzeigen",
      description:
        "Banner-Rotator oben im Admin-Dashboard. Nur Super-Admins können bearbeiten.",
    },
    fr: {
      title: "Annonces tableau de bord",
      description:
        "Bannière rotative en haut du tableau de bord admin. Seuls les super admins peuvent modifier.",
    },
  } as const;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  return (
    <div>
      <PageHeader title={t.title} description={t.description} />
      <AdsClient locale={locale} initialAds={ads} />
    </div>
  );
}
