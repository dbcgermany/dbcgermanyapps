import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { affiliateEnabled } from "@dbc/affiliate";
import { getEvent } from "@/actions/events";
import {
  listAffiliatesAction,
  listEventAffiliatesAction,
} from "@/actions/affiliates";
import { PageHeader } from "@/components/page-header";
import { EventAffiliatesClient } from "./event-affiliates-client";

export default async function EventAffiliatesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!affiliateEnabled()) notFound();
  const { locale, id } = await params;
  const event = await getEvent(id);
  const [eventAffiliates, allAffiliates, tBack] = await Promise.all([
    listEventAffiliatesAction(id, event.slug),
    listAffiliatesAction(),
    getTranslations({ locale, namespace: "admin.back" }),
  ]);

  const titleKey = `title_${locale}` as keyof typeof event;
  const eventTitle =
    (event[titleKey] as string | undefined) || event.title_en;

  return (
    <div>
      <PageHeader
        title={`Affiliate marketing · ${eventTitle}`}
        description="Enroll partners with a referral code and a private dashboard link. Each affiliate gets one of each — no login required."
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />
      <EventAffiliatesClient
        eventId={id}
        eventSlug={event.slug}
        eventEndsAt={event.ends_at}
        affiliates={allAffiliates.map((a) => ({
          id: a.id,
          display_name: a.display_name,
          contact_email: a.contact_email,
          status: a.status,
        }))}
        eventAffiliates={eventAffiliates}
        locale={locale}
      />
    </div>
  );
}
