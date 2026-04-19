import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  const t = {
    en: {
      title: "Sponsors",
      description:
        "Manage sponsorship deals and partners for this event. Track status, deal value, contact info, and deliverables.",
    },
    de: {
      title: "Sponsoren",
      description:
        "Sponsoring-Deals und Partner f\u00FCr diese Veranstaltung verwalten.",
    },
    fr: {
      title: "Sponsors",
      description:
        "G\u00E9rer les accords de parrainage et les partenaires de cet \u00E9v\u00E9nement.",
    },
  }[locale] ?? {
    title: "Sponsors",
    description: "Manage sponsorship deals and partners.",
  };

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

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
