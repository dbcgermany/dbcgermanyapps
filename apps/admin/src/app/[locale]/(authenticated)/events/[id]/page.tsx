import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Gift,
  Image as ImageIcon,
  Mail,
  QrCode,
  Scissors,
  Tag,
  Ticket,
  TicketCheck,
  Upload,
  Users,
} from "lucide-react";
import { Badge, Card } from "@dbc/ui";
import { getEvent, togglePublish, duplicateEvent } from "@/actions/events";
import { PageHeader } from "@/components/page-header";
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
    <div>
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/events`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to events
        </Link>
        <PageHeader
          title={(event[titleKey] as string) || event.title_en}
          className="mt-2"
          cta={
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
          }
        />
        <div className="mt-1 flex items-center gap-3">
          <Badge variant={event.is_published ? "success" : "warning"}>
            {event.is_published ? "Published" : "Draft"}
          </Badge>
          <span className="text-sm text-muted-foreground capitalize">
            {event.event_type}
          </span>
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
                <Badge key={method} variant="default" className="capitalize">
                  {method}
                </Badge>
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

      {/* Management Hub — all sub-pages grouped */}
      <div className="mt-12 space-y-10 border-t border-border pt-8">
        {/* Setup */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">Setup</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink href={`/${locale}/events/${id}/tiers`} icon={Tag} title="Ticket Tiers" desc="Create and manage ticket pricing" />
            <HubLink href={`/${locale}/events/${id}/coupons`} icon={Scissors} title="Coupon Codes" desc="Create discount codes for this event" />
            <HubLink href={`/${locale}/events/${id}/schedule`} icon={Calendar} title="Schedule & Speakers" desc="Manage the event agenda and speakers" />
            <HubLink href={`/${locale}/events/${id}/ticket-preview`} icon={TicketCheck} title="Ticket Preview" desc="Preview the PDF ticket design" />
          </div>
        </section>

        {/* Marketing */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">Marketing</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <HubLink href={`/${locale}/events/${id}/emails`} icon={Mail} title="Email Sequences" desc="Automated post-event email campaigns" />
            <HubLink href={`/${locale}/events/${id}/invitations`} icon={Gift} title="Invitations" desc="Send formal invitations with comped tickets" />
            <HubLink href={`/${locale}/events/${id}/invitations/bulk`} icon={Upload} title="Bulk Invitations" desc="Import a CSV of invitees" />
          </div>
        </section>

        {/* Live & post-event */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">Live & post-event</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <HubLink href={`/${locale}/events/${id}/attendees`} icon={Users} title="Attendees" desc="View registrations and check-in status" />
            <HubLink href={`/${locale}/events/${id}/media`} icon={ImageIcon} title="Media" desc="Upload photos and videos after the event" />
            <HubLink href={`/${locale}/events/${id}/poster`} icon={QrCode} title="Door-sale Poster" desc="Printable QR poster for venue entrance" />
          </div>
        </section>
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

function HubLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Tag;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card padding="sm" className="group rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/50">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" strokeWidth={1.75} />
          <div>
            <p className="font-medium group-hover:text-primary">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
