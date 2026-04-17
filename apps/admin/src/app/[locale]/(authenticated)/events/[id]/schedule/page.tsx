import Link from "next/link";
import { getScheduleItems } from "@/actions/schedule";
import { ScheduleForm } from "./schedule-form";
import { ScheduleSortable } from "./schedule-sortable";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const items = await getScheduleItems(eventId);

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <PageHeader title="Schedule & Speakers" className="mt-2" />
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
        <h2 className="font-heading text-lg font-semibold">
          Add Schedule Item
        </h2>
        <ScheduleForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
