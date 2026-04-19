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
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  const pageTitle =
    locale === "de" ? "Veranstaltung bearbeiten" : locale === "fr" ? "Modifier l’événement" : "Edit event";

  return (
    <div>
      <PageHeader
        title={pageTitle}
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />

      <EditEventForm locale={locale} event={event} />
    </div>
  );
}
