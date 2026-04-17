import Link from "next/link";
import { Badge } from "@dbc/ui";
import { getEvents, togglePublish } from "@/actions/events";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const events = await getEvents();

  return (
    <div>
      <PageHeader
        title="Events"
        cta={
          <Link
            href={`/${locale}/events/new`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Event
          </Link>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          message="No events yet. Create your first event to get started."
          cta={{ label: "Create Event", href: `/${locale}/events/new` }}
          className="mt-12"
        />
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
                    <Badge variant={event.is_published ? "success" : "warning"}>
                      {event.is_published ? "Published" : "Draft"}
                    </Badge>
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
