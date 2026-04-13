import Link from "next/link";
import { getScheduleItems, deleteScheduleItem } from "@/actions/schedule";
import { ScheduleForm } from "./schedule-form";

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
            <div
              key={item.id}
              className="flex items-start justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-medium">{item.title_en}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {new Date(item.starts_at).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  &ndash;{" "}
                  {new Date(item.ends_at).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {item.speaker_name && (
                  <p className="mt-1 text-sm">
                    {item.speaker_name}
                    {item.speaker_title && (
                      <span className="text-muted-foreground">
                        {" \u2014 "}
                        {item.speaker_title}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteScheduleItem(item.id, eventId, locale);
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </form>
            </div>
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
