import Link from "next/link";
import { getScheduleItems } from "@/actions/schedule";
import { ScheduleForm } from "./schedule-form";
import { ScheduleSortable } from "./schedule-sortable";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

const T = {
  en: { back: "← Back to event", title: "Schedule & Speakers", addItem: "Add Schedule Item" },
  de: { back: "← Zurück zur Veranstaltung", title: "Programm & Sprecher:innen", addItem: "Programmpunkt hinzufügen" },
  fr: { back: "← Retour à l’événement", title: "Programme & intervenants", addItem: "Ajouter un élément" },
} as const;

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const items = await getScheduleItems(eventId);

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t.back}
        </Link>
        <PageHeader title={t.title} className="mt-2" />
      </div>

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
