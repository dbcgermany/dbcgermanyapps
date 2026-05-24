import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getEventSponsors } from "@/actions/sponsors";
import { PageHeader } from "@/components/page-header";
import { AddButton } from "@/components/add-button";
import { SponsorsClient } from "./sponsors-client";
import { pickSponsorT } from "./copy";

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
  const t = pickSponsorT(locale);

  return (
    <div>
      <PageHeader
        title={t.listTitle}
        description={t.listDescription}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        cta={
          <AddButton
            href={`/${locale}/events/${eventId}/sponsors/new`}
            label={t.addSponsor}
          />
        }
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
