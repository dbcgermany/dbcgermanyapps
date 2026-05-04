import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { FunnelForm } from "../funnel-form";
import { listFunnelEventOptions } from "@/actions/funnels";

export default async function NewFunnelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.funnels.new" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const eventOptions = await listFunnelEventOptions(locale);

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/funnels`, label: tBack("funnels") }}
      />
      <FunnelForm mode="create" locale={locale} eventOptions={eventOptions} />
    </div>
  );
}
