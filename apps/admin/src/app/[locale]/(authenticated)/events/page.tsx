import Link from "next/link";
import { getEvents, togglePublish } from "@/actions/events";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const events = await getEvents();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Events</h1>
        <Link
          href={`/${locale}/events/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No events yet</p>
          <p className="mt-1 text-sm">
            Create your first event to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">City</th>
                <th className="px-4 py-3 text-left font-medium">Capacity</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/events/${event.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {locale === "de"
                        ? event.title_de
                        : locale === "fr"
                          ? event.title_fr
                          : event.title_en}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {event.event_type}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(event.starts_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.city}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.capacity}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        event.is_published
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {event.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await togglePublish(event.id, locale);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {event.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
