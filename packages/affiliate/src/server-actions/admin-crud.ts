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
  const expiresAt = opts.eventEndsAt
    ? new Date(
        new Date(opts.eventEndsAt).getTime() + 20 * 86400000
      ).toISOString()
    : // No end date on the event — fall back to 6 months from now.
      new Date(Date.now() + 180 * 86400000).toISOString();

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

export async function listEventAffiliates(
  supabase: SupabaseClient,
  eventId: string
) {
  const { data, error } = await supabase
    .from("event_affiliates")
    .select(
      `id, event_id, affiliate_id, commission_pct, status, coupon_id,
       dashboard_token, token_expires_at, token_revoked_at, created_at,
       affiliates ( id, display_name, contact_email, status ),
       coupons ( id, code, discount_type, discount_value )`
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listEventAffiliates: ${error.message}`);
  return data ?? [];
}
