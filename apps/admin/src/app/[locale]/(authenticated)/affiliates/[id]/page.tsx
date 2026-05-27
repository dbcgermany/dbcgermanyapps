import { notFound } from "next/navigation";
import {
  affiliateEnabled,
  buildDashboardUrl,
  buildReferralUrl,
  type AffiliateLocale,
} from "@dbc/affiliate";
import { createServerClient } from "@dbc/supabase/server";
import {
  getAffiliateAction,
  listPayoutsForAffiliateAction,
} from "@/actions/affiliates";
import { PageHeader } from "@/components/page-header";
import { AffiliateDetailClient } from "./affiliate-detail-client";

export default async function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!affiliateEnabled()) notFound();
  const { locale, id } = await params;
  const aff = await getAffiliateAction(id);
  if (!aff) notFound();

  const supabase = await createServerClient();
  const [{ data: enrollments }, payouts] = await Promise.all([
    supabase
      .from("event_affiliates")
      .select(
        `id, event_id, commission_pct, status, dashboard_token, tracking_tag,
         token_expires_at, token_revoked_at,
         events ( id, title_en, title_de, title_fr, starts_at, ends_at, slug ),
         coupons ( code )`
      )
      .eq("affiliate_id", id)
      .order("created_at", { ascending: false }),
    listPayoutsForAffiliateAction(id),
  ]);

  // Enrich each enrollment with the computed URLs + live referral/commission
  // aggregates so the admin profile page shows everything at a glance.
  const affLocale = (aff.preferred_locale as AffiliateLocale) ?? "en";
  const enrollmentRows = await Promise.all(
    ((enrollments ?? []) as Array<{
      id: string;
      event_id: string;
      commission_pct: number;
      status: string;
      dashboard_token: string;
      tracking_tag: string;
      token_expires_at: string;
      token_revoked_at: string | null;
      events:
        | {
            id: string;
            title_en: string;
            title_de: string | null;
            title_fr: string | null;
            starts_at: string;
            ends_at: string | null;
            slug: string;
          }
        | null
        | Array<{
            id: string;
            title_en: string;
            title_de: string | null;
            title_fr: string | null;
            starts_at: string;
            ends_at: string | null;
            slug: string;
          }>;
      coupons: { code: string } | null | Array<{ code: string }>;
    }>).map(async (ea) => {
      const ev = Array.isArray(ea.events) ? ea.events[0] : ea.events;
      const cp = Array.isArray(ea.coupons) ? ea.coupons[0] : ea.coupons;
      const evTitle = ev
        ? (locale === "de" && ev.title_de) ||
          (locale === "fr" && ev.title_fr) ||
          ev.title_en
        : "—";
      const [{ count: refCount }, { data: comms }] = await Promise.all([
        supabase
          .from("affiliate_referrals")
          .select("id", { count: "exact", head: true })
          .eq("event_affiliate_id", ea.id),
        supabase
          .from("affiliate_commissions")
          .select("commission_cents, status")
          .eq("event_affiliate_id", ea.id),
      ]);
      let earned = 0;
      let pending = 0;
      for (const c of (comms ?? []) as Array<{
        commission_cents: number;
        status: string;
      }>) {
        if (c.status === "paid") earned += c.commission_cents;
        if (["pending", "eligible", "payout_queued"].includes(c.status))
          pending += c.commission_cents;
      }
      return {
        id: ea.id,
        event_id: ea.event_id,
        commission_pct: Number(ea.commission_pct),
        status: ea.status,
        dashboard_token: ea.dashboard_token,
        token_expires_at: ea.token_expires_at,
        token_revoked_at: ea.token_revoked_at,
        event: ev
          ? {
              id: ev.id,
              title: evTitle,
              starts_at: ev.starts_at,
              ends_at: ev.ends_at,
              slug: ev.slug,
            }
          : null,
        coupon_code: cp?.code ?? null,
        referralUrl: ev
          ? buildReferralUrl({
              locale: affLocale,
              eventSlug: ev.slug,
              trackingTag: ea.tracking_tag,
              couponCode: cp?.code ?? null,
            })
          : "",
        dashboardUrl: buildDashboardUrl({
          locale: affLocale,
          token: ea.dashboard_token,
        }),
        referralsCount: refCount ?? 0,
        earnedCents: earned,
        pendingCents: pending,
      };
    })
  );

  return (
    <div>
      <PageHeader
        title={aff.display_name}
        description={aff.contact_email}
        back={{ href: `/${locale}/affiliates`, label: "Affiliates" }}
      />
      <div className="mt-6">
        <AffiliateDetailClient
          affiliate={aff}
          enrollments={enrollmentRows}
          payouts={payouts}
          locale={locale}
        />
      </div>
    </div>
  );
}
