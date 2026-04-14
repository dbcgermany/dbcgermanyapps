import Link from "next/link";
import { getScheduleItems } from "@/actions/schedule";
import { ScheduleForm } from "./schedule-form";
import { ScheduleRow } from "./schedule-row";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const items = await getScheduleItems(eventId);

  return (
    <div className="p-8">
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          Schedule & Speakers
        </h1>
      </div>

      {/* Existing schedule items */}
      {items.length > 0 && (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <ScheduleRow
              key={item.id}
              item={item}
              eventId={eventId}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Add new schedule item */}
      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold">
          Add Schedule Item
        </h2>
        <ScheduleForm eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
