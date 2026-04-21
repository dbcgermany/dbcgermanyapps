import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { FunnelForm } from "../funnel-form";

const T = {
  en: { title: "New funnel" },
  de: { title: "Neuer Funnel" },
  fr: { title: "Nouveau funnel" },
} as const;

export default async function NewFunnelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/funnels`, label: tBack("funnels") }}
      />
      <FunnelForm mode="create" locale={locale} />
    </div>
  );
}
