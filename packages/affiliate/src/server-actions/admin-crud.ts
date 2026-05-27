/**
 * Admin-only server actions for managing affiliates and event enrollments.
 * Callers MUST guard with requireRole() before invoking — these functions
 * assume the caller is already authenticated as staff.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateDashboardToken, generateTrackingTag } from "../token";
import { buildDashboardUrl, buildReferralUrl } from "../urls";
import type {
  Affiliate,
  AffiliateInsert,
  AffiliateUpdate,
  EventAffiliate,
  AffiliateLocale,
} from "../types";
import {
  setTierGoalsForEnrollment,
  type GoalRuleInput,
} from "./goals";

export interface CreateAffiliateInput {
  display_name: string;
  contact_email: string;
  preferred_locale?: AffiliateLocale;
  country?: string | null;
  notes?: string | null;
}

export async function createAffiliate(
  supabase: SupabaseClient,
  input: CreateAffiliateInput
): Promise<Affiliate> {
  const insert: AffiliateInsert = {
    display_name: input.display_name.trim(),
    contact_email: input.contact_email.trim().toLowerCase(),
    preferred_locale: input.preferred_locale ?? "en",
    country: input.country ?? null,
    notes: input.notes ?? null,
    status: "invited",
  };
  const { data, error } = await supabase
    .from("affiliates")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw new Error(`createAffiliate: ${error.message}`);
  return data as Affiliate;
}

export async function updateAffiliate(
  supabase: SupabaseClient,
  id: string,
  patch: AffiliateUpdate
): Promise<Affiliate> {
  const { data, error } = await supabase
    .from("affiliates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateAffiliate: ${error.message}`);
  return data as Affiliate;
}

export async function listAffiliates(
  supabase: SupabaseClient
): Promise<Affiliate[]> {
  const { data, error } = await supabase
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listAffiliates: ${error.message}`);
  return (data ?? []) as Affiliate[];
}

export async function getAffiliate(
  supabase: SupabaseClient,
  id: string
): Promise<Affiliate | null> {
  const { data, error } = await supabase
    .from("affiliates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getAffiliate: ${error.message}`);
  return (data as Affiliate | null) ?? null;
}

export interface EnrollAffiliateInput {
  affiliateId: string;
  eventId: string;
  commissionPct: number;
  // Coupon is OPTIONAL. When omitted, the affiliate's referral URL still
  // works via ?src=aff_<tracking_tag>, and the buyer pays full price; the
  // affiliate still earns commission on the conversion.
  coupon?: {
    code: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    applicableTierIds?: string[] | null;
  } | null;
  // Explicit override for the dashboard token expiry. If omitted, the
  // default is event.ends_at + 20 days (or 180 days from now when the
  // event has no end date).
  tokenExpiresAt?: string | null;
  // Optional free-ticket goal rules. Replaces any existing goals.
  tierGoals?: GoalRuleInput[] | null;
}

export interface EnrollAffiliateResult {
  eventAffiliate: EventAffiliate;
  couponId: string | null;
  couponCode: string | null;
  trackingTag: string;
  dashboardToken: string;
  referralUrl: string;
  dashboardUrl: string;
}

/**
 * Enroll an affiliate in an event. Always creates:
 *   - event_affiliates row with dashboard_token + tracking_tag + commission_pct
 *
 * Optionally creates:
 *   - coupons row (purpose='affiliate') if input.coupon is set
 *
 * No coupon = no buyer discount; affiliate still earns commission via ?src
 * tracking on the referral URL.
 */
export async function enrollAffiliateInEvent(
  supabase: SupabaseClient,
  input: EnrollAffiliateInput,
  opts: { eventEndsAt: string | null; eventSlug: string; locale: AffiliateLocale }
): Promise<EnrollAffiliateResult> {
  let couponId: string | null = null;
  let couponCode: string | null = null;

  // 1. Optionally create the discount coupon.
  if (input.coupon) {
    const { data: couponRow, error: couponErr } = await supabase
      .from("coupons")
      .insert({
        code: input.coupon.code.trim().toUpperCase(),
        event_id: input.eventId,
        discount_type: input.coupon.discountType,
        discount_value: input.coupon.discountValue,
        applicable_tier_ids: input.coupon.applicableTierIds ?? null,
        is_active: true,
        purpose: "affiliate",
      })
      .select("id, code")
      .single();
    if (couponErr || !couponRow) {
      throw new Error(
        `enrollAffiliateInEvent: create coupon: ${couponErr?.message ?? "unknown"}`
      );
    }
    couponId = couponRow.id;
    couponCode = couponRow.code;
  }

  // 2. Create the event_affiliates row.
  const token = generateDashboardToken();
  const tag = generateTrackingTag();
  const expiresAt =
    input.tokenExpiresAt ??
    (opts.eventEndsAt
      ? new Date(
          new Date(opts.eventEndsAt).getTime() + 20 * 86400000
        ).toISOString()
      : // No end date on the event — fall back to 6 months from now.
        new Date(Date.now() + 180 * 86400000).toISOString());

  const { data: ea, error: eaErr } = await supabase
    .from("event_affiliates")
    .insert({
      event_id: input.eventId,
      affiliate_id: input.affiliateId,
      commission_pct: input.commissionPct,
      coupon_id: couponId,
      status: "active",
      dashboard_token: token,
      tracking_tag: tag,
      token_expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (eaErr || !ea) {
    throw new Error(
      `enrollAffiliateInEvent: create event_affiliate: ${eaErr?.message ?? "unknown"}`
    );
  }

  // Mark the affiliate as active if they were still in "invited".
  await supabase
    .from("affiliates")
    .update({ status: "active" })
    .eq("id", input.affiliateId)
    .eq("status", "invited");

  // Persist free-ticket goal rules, if any.
  if (input.tierGoals && input.tierGoals.length > 0) {
    await setTierGoalsForEnrollment(supabase, ea.id, input.tierGoals);
  }

  return {
    eventAffiliate: ea as EventAffiliate,
    couponId,
    couponCode,
    trackingTag: tag,
    dashboardToken: token,
    referralUrl: buildReferralUrl({
      locale: opts.locale,
      eventSlug: opts.eventSlug,
      trackingTag: tag,
      couponCode,
    }),
    dashboardUrl: buildDashboardUrl({ locale: opts.locale, token }),
  };
}

export async function rotateDashboardToken(
  supabase: SupabaseClient,
  eventAffiliateId: string
): Promise<{ token: string }> {
  const token = generateDashboardToken();
  const { error } = await supabase
    .from("event_affiliates")
    .update({
      dashboard_token: token,
      token_revoked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventAffiliateId);
  if (error) throw new Error(`rotateDashboardToken: ${error.message}`);
  return { token };
}

export async function revokeDashboardToken(
  supabase: SupabaseClient,
  eventAffiliateId: string
): Promise<void> {
  const { error } = await supabase
    .from("event_affiliates")
    .update({
      token_revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventAffiliateId);
  if (error) throw new Error(`revokeDashboardToken: ${error.message}`);
}

export async function extendTokenExpiry(
  supabase: SupabaseClient,
  eventAffiliateId: string,
  extraDays: number
): Promise<{ expiresAt: string }> {
  const { data: row } = await supabase
    .from("event_affiliates")
    .select("token_expires_at")
    .eq("id", eventAffiliateId)
    .single();
  const baseTime =
    row?.token_expires_at && new Date(row.token_expires_at) > new Date()
      ? new Date(row.token_expires_at).getTime()
      : Date.now();
  const newExpiry = new Date(baseTime + extraDays * 86400000).toISOString();
  const { error } = await supabase
    .from("event_affiliates")
    .update({
      token_expires_at: newExpiry,
      token_revoked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventAffiliateId);
  if (error) throw new Error(`extendTokenExpiry: ${error.message}`);
  return { expiresAt: newExpiry };
}

export async function updateEventAffiliate(
  supabase: SupabaseClient,
  eventAffiliateId: string,
  patch: { commission_pct?: number; status?: "active" | "paused" | "ended" }
): Promise<void> {
  const { error } = await supabase
    .from("event_affiliates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", eventAffiliateId);
  if (error) throw new Error(`updateEventAffiliate: ${error.message}`);
}

export interface EventAffiliateListRow {
  id: string;
  event_id: string;
  affiliate_id: string;
  commission_pct: number;
  status: string;
  coupon_id: string | null;
  dashboard_token: string;
  tracking_tag: string;
  token_expires_at: string;
  token_revoked_at: string | null;
  created_at: string;
  affiliate: {
    id: string;
    display_name: string;
    contact_email: string;
    status: string;
    preferred_locale: AffiliateLocale;
  };
  coupon: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
  referralUrl: string;
  dashboardUrl: string;
  referralsCount: number;
  earnedCents: number;
  pendingCents: number;
  goalsTotal: number;
  goalsReached: number;
  goalsFulfilled: number;
}

/**
 * Listing the per-event roster needs more than the raw rows — admin wants
 * the live referral URL + dashboard URL (to copy / resend manually), and
 * a per-affiliate snapshot of conversions + earnings. This batches the
 * commission aggregates in a second query and stitches it together.
 */
export async function listEventAffiliates(
  supabase: SupabaseClient,
  eventId: string,
  opts: { eventSlug: string }
): Promise<EventAffiliateListRow[]> {
  const { data: rows, error } = await supabase
    .from("event_affiliates")
    .select(
      `id, event_id, affiliate_id, commission_pct, status, coupon_id,
       dashboard_token, tracking_tag, token_expires_at, token_revoked_at, created_at,
       affiliates ( id, display_name, contact_email, status, preferred_locale ),
       coupons ( id, code, discount_type, discount_value )`
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listEventAffiliates: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id as string);
  const [{ data: referralCounts }, { data: commissionRows }, { data: goalRows }] =
    await Promise.all([
      supabase
        .from("affiliate_referrals")
        .select("event_affiliate_id")
        .in("event_affiliate_id", ids),
      supabase
        .from("affiliate_commissions")
        .select("event_affiliate_id, commission_cents, status")
        .in("event_affiliate_id", ids),
      supabase
        .from("event_affiliate_tier_goals")
        .select("event_affiliate_id, tier_id, target_count, fulfilled_at")
        .in("event_affiliate_id", ids),
    ]);

  const refsBy = new Map<string, number>();
  for (const r of referralCounts ?? []) {
    const id = r.event_affiliate_id as string;
    refsBy.set(id, (refsBy.get(id) ?? 0) + 1);
  }
  const earnedBy = new Map<string, number>();
  const pendingBy = new Map<string, number>();
  for (const c of commissionRows ?? []) {
    const id = c.event_affiliate_id as string;
    const cents = c.commission_cents as number;
    const s = c.status as string;
    if (s === "paid") earnedBy.set(id, (earnedBy.get(id) ?? 0) + cents);
    if (s === "pending" || s === "eligible" || s === "payout_queued")
      pendingBy.set(id, (pendingBy.get(id) ?? 0) + cents);
  }

  // For each enrollment, compute goal totals + fulfilled count, and how
  // many goals are currently reached (live count >= target_count). Need a
  // per-enrollment ticket tally by tier to know that, so we batch ticket
  // queries via a single in() lookup per referred order set.
  const goalsByEa = new Map<
    string,
    Array<{ tier_id: string; target_count: number; fulfilled_at: string | null }>
  >();
  for (const g of (goalRows ?? []) as Array<{
    event_affiliate_id: string;
    tier_id: string;
    target_count: number;
    fulfilled_at: string | null;
  }>) {
    const arr = goalsByEa.get(g.event_affiliate_id) ?? [];
    arr.push({
      tier_id: g.tier_id,
      target_count: g.target_count,
      fulfilled_at: g.fulfilled_at,
    });
    goalsByEa.set(g.event_affiliate_id, arr);
  }
  const reachedBy = new Map<string, number>();
  const fulfilledBy = new Map<string, number>();
  if (goalsByEa.size > 0) {
    const { data: refs } = await supabase
      .from("affiliate_referrals")
      .select("event_affiliate_id, order_id")
      .in("event_affiliate_id", Array.from(goalsByEa.keys()));
    const ordersByEa = new Map<string, string[]>();
    for (const r of (refs ?? []) as Array<{
      event_affiliate_id: string;
      order_id: string;
    }>) {
      const arr = ordersByEa.get(r.event_affiliate_id) ?? [];
      arr.push(r.order_id);
      ordersByEa.set(r.event_affiliate_id, arr);
    }
    for (const [eaId, goals] of goalsByEa.entries()) {
      const orderIds = ordersByEa.get(eaId) ?? [];
      let fulfilled = 0;
      let reached = 0;
      const countByTier = new Map<string, number>();
      if (orderIds.length > 0) {
        const { data: tickets } = await supabase
          .from("tickets")
          .select("tier_id, orders!inner ( status )")
          .in("order_id", orderIds)
          .is("revoked_at", null);
        for (const t of (tickets ?? []) as Array<{
          tier_id: string;
          orders: { status: string } | { status: string }[] | null;
        }>) {
          const orderRow = Array.isArray(t.orders) ? t.orders[0] : t.orders;
          const status = orderRow?.status;
          if (
            !status ||
            ["refunded", "cancelled", "expired"].includes(status)
          )
            continue;
          countByTier.set(t.tier_id, (countByTier.get(t.tier_id) ?? 0) + 1);
        }
      }
      for (const g of goals) {
        if (g.fulfilled_at) fulfilled += 1;
        if ((countByTier.get(g.tier_id) ?? 0) >= g.target_count) reached += 1;
      }
      reachedBy.set(eaId, reached);
      fulfilledBy.set(eaId, fulfilled);
    }
  }

  return rows.map((r) => {
    const aff = (Array.isArray(r.affiliates) ? r.affiliates[0] : r.affiliates) as
      | EventAffiliateListRow["affiliate"]
      | null;
    const cp = (Array.isArray(r.coupons) ? r.coupons[0] : r.coupons) as
      | EventAffiliateListRow["coupon"]
      | null;
    const locale = (aff?.preferred_locale as AffiliateLocale) ?? "en";
    return {
      id: r.id as string,
      event_id: r.event_id as string,
      affiliate_id: r.affiliate_id as string,
      commission_pct: Number(r.commission_pct),
      status: r.status as string,
      coupon_id: (r.coupon_id as string | null) ?? null,
      dashboard_token: r.dashboard_token as string,
      tracking_tag: r.tracking_tag as string,
      token_expires_at: r.token_expires_at as string,
      token_revoked_at: (r.token_revoked_at as string | null) ?? null,
      created_at: r.created_at as string,
      affiliate: aff ?? {
        id: r.affiliate_id as string,
        display_name: "—",
        contact_email: "",
        status: "",
        preferred_locale: "en",
      },
      coupon: cp,
      referralUrl: buildReferralUrl({
        locale,
        eventSlug: opts.eventSlug,
        trackingTag: r.tracking_tag as string,
        couponCode: cp?.code ?? null,
      }),
      dashboardUrl: buildDashboardUrl({
        locale,
        token: r.dashboard_token as string,
      }),
      referralsCount: refsBy.get(r.id as string) ?? 0,
      earnedCents: earnedBy.get(r.id as string) ?? 0,
      pendingCents: pendingBy.get(r.id as string) ?? 0,
      goalsTotal: goalsByEa.get(r.id as string)?.length ?? 0,
      goalsReached: reachedBy.get(r.id as string) ?? 0,
      goalsFulfilled: fulfilledBy.get(r.id as string) ?? 0,
    };
  });
}
