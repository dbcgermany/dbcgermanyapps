import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getTiers } from "@/actions/tiers";
import { EditEventForm } from "./edit-form";
import { PageHeader } from "@/components/page-header";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [event, tiers] = await Promise.all([getEvent(id), getTiers(id)]);
  const [tBack, t] = await Promise.all([
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.events" }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("editPageTitle")}
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />

      <EditEventForm
        locale={locale}
        event={{
          ...event,
          tiers: (tiers ?? []).map((t) => ({
            id: t.id,
            name_en: t.name_en,
            name_de: t.name_de,
            price_cents: t.price_cents,
            purpose: t.purpose ?? null,
          })),
        }}
      />
    </div>
  );
}
