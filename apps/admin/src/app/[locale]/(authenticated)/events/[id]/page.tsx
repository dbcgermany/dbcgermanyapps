import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, togglePublish, duplicateEvent } from "@/actions/events";
import { DeleteEventButton } from "./delete-button";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const titleKey = `title_${locale}` as keyof typeof event;
  const descKey = `description_${locale}` as keyof typeof event;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/${locale}/events`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to events
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold">
            {(event[titleKey] as string) || event.title_en}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                event.is_published
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {event.is_published ? "Published" : "Draft"}
            </span>
            <span className="text-sm text-muted-foreground capitalize">
              {event.event_type}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              await togglePublish(id, locale);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {event.is_published ? "Unpublish" : "Publish"}
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await duplicateEvent(id, locale);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              title="Duplicate this event as a new draft (dates shifted +1 year)"
            >
              Duplicate
            </button>
          </form>
          <Link
            href={`/${locale}/events/${id}/edit`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Event Info */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Date & Time
            </h2>
            <p className="mt-1">
              {new Date(event.starts_at).toLocaleDateString(locale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.starts_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              &ndash;{" "}
              {new Date(event.ends_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({event.timezone})
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Venue
            </h2>
            <p className="mt-1">{event.venue_name || "Not set"}</p>
            <p className="text-sm text-muted-foreground">
              {event.venue_address}
              {event.city && `, ${event.city}`}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Capacity
            </h2>
            <p className="mt-1">{event.capacity} attendees</p>
            <p className="text-sm text-muted-foreground">
              Max {event.max_tickets_per_order} tickets per order
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Payment Methods
            </h2>
            <div className="mt-1 flex gap-2">
              {event.enabled_payment_methods?.map((method: string) => (
                <span
                  key={method}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize"
                >
                  {method}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Description
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              {(event[descKey] as string) || event.description_en || "No description yet."}
            </p>
          </section>
        </div>
      </div>

      {/* Management Tabs */}
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="font-heading text-lg font-semibold">Manage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link
            href={`/${locale}/events/${id}/tiers`}
            className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Ticket Tiers</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage ticket pricing
            </p>
          </Link>
          <Link
            href={`/${locale}/events/${id}/coupons`}
            className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Coupon Codes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create discount codes
            </p>
          </Link>
          <Link
            href={`/${locale}/events/${id}/schedule`}
            className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Schedule & Speakers</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage event agenda
            </p>
          </Link>
          <Link
            href={`/${locale}/events/${id}/poster`}
            className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium">Door-sale poster</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Printable QR poster for the venue entrance
            </p>
          </Link>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-12 rounded-lg border border-red-200 p-6 dark:border-red-900/50">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
          Danger zone
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting an event is irreversible and removes all associated tickets, orders, and data.
        </p>
        <DeleteEventButton
          eventId={id}
          eventTitle={event.title_en}
          locale={locale}
        />
      </div>
    </div>
  );
}
