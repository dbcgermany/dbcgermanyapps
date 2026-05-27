import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { affiliateEnabled } from "@dbc/affiliate";
import { createServerClient } from "@dbc/supabase/server";
import { getEvent } from "@/actions/events";
import {
  listAffiliatesAction,
  listEventAffiliatesAction,
  listReachedGoalsAction,
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
  const supabase = await createServerClient();
  const [
    eventAffiliates,
    allAffiliates,
    tBack,
    reachedGoals,
    tiersResult,
  ] = await Promise.all([
    listEventAffiliatesAction(id, event.slug),
    listAffiliatesAction(),
    getTranslations({ locale, namespace: "admin.back" }),
    listReachedGoalsAction(id),
    supabase
      .from("ticket_tiers")
      .select("id, name_en, name_de, name_fr, is_public, counts_as_sold, sort_order")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
  ]);
  const tierOptions = (tiersResult.data ?? [])
    .filter((t) => t.is_public && t.counts_as_sold)
    .map((t) => ({
      id: t.id,
      label:
        (locale === "de" && t.name_de) ||
        (locale === "fr" && t.name_fr) ||
        t.name_en,
    }));

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
        reachedGoals={reachedGoals}
        tierOptions={tierOptions}
        locale={locale}
      />
    </div>
  );
}
