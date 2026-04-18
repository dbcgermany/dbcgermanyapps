import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/actions/events";
import { getEventSponsors } from "@/actions/sponsors";
import { PageHeader } from "@/components/page-header";
import { SponsorsClient } from "./sponsors-client";

export default async function EventSponsorsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;

  const eventOrNull = await getEvent(eventId).catch(() => null);
  if (!eventOrNull) notFound();

  const sponsors = await getEventSponsors(eventId);

  const t = {
    en: {
      back: "Event",
      title: "Sponsors",
      description:
        "Manage sponsorship deals and partners for this event. Track status, deal value, contact info, and deliverables.",
    },
    de: {
      back: "Event",
      title: "Sponsoren",
      description:
        "Sponsoring-Deals und Partner f\u00FCr diese Veranstaltung verwalten.",
    },
    fr: {
      back: "\u00C9v\u00E9nement",
      title: "Sponsors",
      description:
        "G\u00E9rer les accords de parrainage et les partenaires de cet \u00E9v\u00E9nement.",
    },
  }[locale] ?? {
    back: "Event",
    title: "Sponsors",
    description: "Manage sponsorship deals and partners.",
  };

  return (
    <div>
      <Link
        href={`/${locale}/events/${eventId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t.back}
      </Link>
      <PageHeader title={t.title} description={t.description} className="mt-2" />

      <div className="mt-6">
        <SponsorsClient
          eventId={eventId}
          locale={locale}
          sponsors={sponsors}
        />
      </div>
    </div>
  );
}
