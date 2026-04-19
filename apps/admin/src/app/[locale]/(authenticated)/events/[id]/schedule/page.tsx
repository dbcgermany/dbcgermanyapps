import { getTranslations } from "next-intl/server";
import { getScheduleItems } from "@/actions/schedule";
import { ScheduleForm } from "./schedule-form";
import { ScheduleSortable } from "./schedule-sortable";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

const T = {
  en: { title: "Schedule & Speakers", addItem: "Add Schedule Item" },
  de: { title: "Programm & Sprecher:innen", addItem: "Programmpunkt hinzufügen" },
  fr: { title: "Programme & intervenants", addItem: "Ajouter un élément" },
} as const;

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const items = await getScheduleItems(eventId);

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

      {/* Existing schedule items */}
      {items.length > 0 && (
        <div className="mt-6">
          <ScheduleSortable
            items={items}
            eventId={eventId}
            locale={locale}
          />
        </div>
      )}

      {/* Add new schedule item */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t.addItem}</h2>
        <ScheduleForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
