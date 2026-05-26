/**
 * Server-side fetcher for the tokenized affiliate dashboard route. Used by
 * `apps/tickets/src/app/[locale]/partner/[token]/page.tsx`. The route is
 * public — security comes from the unguessability of the token.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { affiliateEnabled } from "../feature-flag";
import { buildReferralUrl } from "../urls";
import type {
  AffiliateLocale,
  CommissionStatus,
  DashboardData,
  PayoutStatus,
} from "../types";

export type DashboardResult =
  | { kind: "ok"; data: DashboardData }
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "revoked" }
  | { kind: "disabled" };

export async function getAffiliateDashboardByToken(
  supabase: SupabaseClient,
  token: string,
  locale: AffiliateLocale
): Promise<DashboardResult> {
  if (!affiliateEnabled()) return { kind: "disabled" };
  if (!token.startsWith("aff_") || token.length < 20) {
    return { kind: "not_found" };
  }

  const { data: ea } = await supabase
    .from("event_affiliates")
    .select(
      `id, event_id, affiliate_id, commission_pct, coupon_id, status,
       dashboard_token, token_expires_at, token_revoked_at,
       affiliates ( id, display_name, contact_email, preferred_locale,
                    country, status, notes, created_at, updated_at,
                    profile_id ),
       events ( id, slug, title_en, title_de, title_fr, starts_at, ends_at ),
       coupons ( id, code, discount_type, discount_value )`
    )
    .eq("dashboard_token", token)
    .maybeSingle();

  if (!ea) return { kind: "not_found" };
  if (ea.token_revoked_at) return { kind: "revoked" };
  if (new Date(ea.token_expires_at) <= new Date()) return { kind: "expired" };

  const affiliate = ea.affiliates as unknown as DashboardData["affiliate"];
  const eventRow = ea.events as unknown as {
    id: string;
    slug: string;
    title_en: string;
    title_de: string | null;
    title_fr: string | null;
    starts_at: string;
    ends_at: string | null;
  };
  const couponRow = ea.coupons as unknown as DashboardData["coupon"];

  const eventTitle =
    (locale === "de" && eventRow.title_de) ||
    (locale === "fr" && eventRow.title_fr) ||
    eventRow.title_en;

  const [{ data: referrals }, { data: payouts }] = await Promise.all([
    supabase
      .from("affiliate_referrals")
      .select(
        `id, order_id, created_at,
         affiliate_commissions!affiliate_commissions_order_id_fkey
           ( commission_cents, status )`
      )
      .eq("event_affiliate_id", ea.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("affiliate_payouts")
      .select("*")
      .eq("affiliate_id", ea.affiliate_id)
      .in("status", ["approved", "paid"])
      .order("created_at", { ascending: false }),
  ]);

  // Aggregates from all commissions for this enrollment (not just the
  // 50-row referrals window).
  const { data: allCommissions } = await supabase
    .from("affiliate_commissions")
    .select("commission_cents, status, cooldown_until")
    .eq("event_affiliate_id", ea.id);

  let ticketsSold = 0;
  let totalEarnedCents = 0;
  let pendingEligibleCents = 0;
  let cooldownCents = 0;
  for (const c of allCommissions ?? []) {
    if (c.status === "paid") totalEarnedCents += c.commission_cents;
    if (c.status === "eligible" || c.status === "payout_queued")
      pendingEligibleCents += c.commission_cents;
    if (c.status === "pending") cooldownCents += c.commission_cents;
  }
  ticketsSold = (referrals ?? []).length;

  const recentReferrals = (referrals ?? []).slice(0, 20).map((r: {
    id: string;
    created_at: string;
    affiliate_commissions:
      | { commission_cents: number; status: string }
      | { commission_cents: number; status: string }[]
      | null;
  }) => {
    const comm = Array.isArray(r.affiliate_commissions)
      ? r.affiliate_commissions[0]
      : r.affiliate_commissions;
    return {
      id: r.id,
      created_at: r.created_at,
      commission_cents:
        (comm as { commission_cents?: number } | null)?.commission_cents ??
        null,
      status:
        ((comm as { status?: CommissionStatus } | null)?.status as
          | CommissionStatus
          | undefined) ?? null,
    };
  });

  const referralUrl = buildReferralUrl({
    locale,
    eventSlug: eventRow.slug,
    couponCode: couponRow.code,
  });

  return {
    kind: "ok",
    data: {
      affiliate,
      eventAffiliate: {
        id: ea.id,
        event_id: ea.event_id,
        affiliate_id: ea.affiliate_id,
        commission_pct: ea.commission_pct,
        coupon_id: ea.coupon_id,
        status: ea.status,
        dashboard_token: ea.dashboard_token,
        token_expires_at: ea.token_expires_at,
        token_revoked_at: ea.token_revoked_at,
        created_at: "",
        updated_at: "",
      },
      event: {
        id: eventRow.id,
        slug: eventRow.slug,
        title: eventTitle,
        starts_at: eventRow.starts_at,
        ends_at: eventRow.ends_at,
      },
      coupon: couponRow,
      kpis: {
        ticketsSold,
        totalEarnedCents,
        pendingEligibleCents,
        cooldownCents,
      },
      recentReferrals,
      payouts: (
        (payouts ?? []) as Array<{
          id: string;
          paid_at: string | null;
          amount_cents: number;
          currency: string;
          payment_reference: string | null;
          statement_storage_path: string | null;
          status: string;
        }>
      ).map((p) => ({
        id: p.id,
        paid_at: p.paid_at,
        amount_cents: p.amount_cents,
        currency: p.currency,
        payment_reference: p.payment_reference,
        statement_storage_path: p.statement_storage_path,
        status: p.status as PayoutStatus,
      })),
      referralUrl,
    },
  };
}
