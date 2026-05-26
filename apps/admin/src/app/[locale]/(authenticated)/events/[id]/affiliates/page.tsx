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
  const [event, eventAffiliates, allAffiliates, tBack] = await Promise.all([
    getEvent(id),
    listEventAffiliatesAction(id),
    listAffiliatesAction(),
    getTranslations({ locale, namespace: "admin.back" }),
  ]);

  const titleKey = `title_${locale}` as keyof typeof event;
  const eventTitle =
    (event[titleKey] as string | undefined) || event.title_en;

  return (
    <>
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
        eventAffiliates={eventAffiliates.map((ea) => {
          const aff = Array.isArray(ea.affiliates)
            ? ea.affiliates[0]
            : ea.affiliates;
          const cp = Array.isArray(ea.coupons) ? ea.coupons[0] : ea.coupons;
          return {
            id: ea.id,
            affiliate_id: ea.affiliate_id,
            commission_pct: Number(ea.commission_pct),
            coupon_id: ea.coupon_id,
            status: ea.status,
            dashboard_token: ea.dashboard_token,
            token_expires_at: ea.token_expires_at,
            token_revoked_at: ea.token_revoked_at,
            affiliates: aff
              ? {
                  id: aff.id,
                  display_name: aff.display_name,
                  contact_email: aff.contact_email,
                  status: aff.status,
                }
              : null,
            coupons: cp
              ? {
                  id: cp.id,
                  code: cp.code,
                  discount_type: cp.discount_type,
                  discount_value: cp.discount_value,
                }
              : null,
          };
        })}
        locale={locale}
      />
    </>
  );
}
