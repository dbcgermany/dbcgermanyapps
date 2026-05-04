import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { EditEventForm } from "./edit-form";
import { PageHeader } from "@/components/page-header";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const event = await getEvent(id);
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

      <EditEventForm locale={locale} event={event} />
    </div>
  );
}
