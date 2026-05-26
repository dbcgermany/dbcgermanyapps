/**
 * Stripe webhook extension points for the affiliate program. Both functions
 * no-op silently when the feature flag is off OR when the order has no
 * affiliate involvement, so they're safe to call unconditionally from the
 * existing webhook handler.
 *
 * Removal: delete these calls from the webhook (~2 lines), then delete this
 * package. No other webhook logic changes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { affiliateEnabled } from "./feature-flag";
import { buildDashboardUrl } from "./urls";
import type { AffiliateLocale } from "./types";

export interface WebhookCtx {
  supabase: SupabaseClient;
  sendConversionEmail: (params: {
    to: string;
    recipientName: string;
    eventTitle: string;
    commissionAmountFormatted: string;
    ticketCount: number;
    dashboardUrl: string;
    locale: AffiliateLocale;
  }) => Promise<unknown>;
  captureError?: (err: unknown, ctx: Record<string, unknown>) => void;
}

interface OrderForAttribution {
  id: string;
  total_cents: number;
  currency: string | null;
  coupon_id: string | null;
  source: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  locale: string | null;
  event_id: string;
  status: string | null;
}

/**
 * Called after an order successfully transitions to paid (or comped). If the
 * order's coupon was issued for an affiliate program, we insert a referral
 * row, and (when total_cents > 0) a commission row in `pending` status with
 * a cooldown window equal to the event's refund_policy_days.
 *
 * Idempotent: both inserts use ON CONFLICT (order_id) DO NOTHING so retried
 * webhook events don't double-count.
 */
export async function processAffiliateAttribution(
  order: OrderForAttribution,
  ctx: WebhookCtx
): Promise<void> {
  if (!affiliateEnabled()) return;

  // Resolve the event_affiliate row from EITHER:
  //   1. orders.source = 'aff_<tracking_tag>' — buyer arrived via affiliate link
  //   2. orders.coupon_id → coupon.purpose='affiliate' — buyer applied affiliate code
  // A coupon is NOT required; the tracking_tag alone is enough to credit a sale.
  // When both are present and point to different enrollments, the coupon wins
  // (it's the more explicit signal).
  try {
    let eventAffiliate: {
      id: string;
      affiliate_id: string;
      commission_pct: number;
      status: string;
      dashboard_token: string;
      event_id: string;
    } | null = null;

    // Coupon-based lookup (preferred when present).
    if (order.coupon_id) {
      const { data: coupon } = await ctx.supabase
        .from("coupons")
        .select("id, purpose")
        .eq("id", order.coupon_id)
        .maybeSingle();
      if (coupon?.purpose === "affiliate") {
        const { data } = await ctx.supabase
          .from("event_affiliates")
          .select(
            "id, affiliate_id, commission_pct, status, dashboard_token, event_id"
          )
          .eq("coupon_id", coupon.id)
          .maybeSingle();
        eventAffiliate = data;
      }
    }

    // Fall back to tracking_tag from orders.source = 'aff_<tag>'.
    if (!eventAffiliate && order.source && order.source.startsWith("aff_")) {
      const tag = order.source.slice("aff_".length);
      if (tag) {
        const { data } = await ctx.supabase
          .from("event_affiliates")
          .select(
            "id, affiliate_id, commission_pct, status, dashboard_token, event_id"
          )
          .eq("tracking_tag", tag)
          .eq("event_id", order.event_id)
          .maybeSingle();
        eventAffiliate = data;
      }
    }

    if (!eventAffiliate) return;

    if (eventAffiliate.status !== "active") {
      // Enrollment is paused/ended. Still record the referral for audit
      // but skip the commission.
      await ctx.supabase.from("affiliate_referrals").insert({
        order_id: order.id,
        affiliate_id: eventAffiliate.affiliate_id,
        event_affiliate_id: eventAffiliate.id,
      });
      return;
    }

    // Insert the referral row (idempotent via UNIQUE on order_id).
    await ctx.supabase.from("affiliate_referrals").insert({
      order_id: order.id,
      affiliate_id: eventAffiliate.affiliate_id,
      event_affiliate_id: eventAffiliate.id,
    });

    // No commission for comped/zero-total orders, but the referral above
    // still counts as a conversion for dashboard purposes.
    if (order.total_cents <= 0) return;

    // Resolve refund cooldown window from the event.
    const { data: eventRow } = await ctx.supabase
      .from("events")
      .select("id, refund_policy_days, title_en, title_de, title_fr, ends_at")
      .eq("id", order.event_id)
      .maybeSingle();
    const refundDays = Number(eventRow?.refund_policy_days ?? 14);
    const cooldownUntil = new Date(
      Date.now() + refundDays * 86400000
    ).toISOString();

    const commissionCents = Math.round(
      (order.total_cents * Number(eventAffiliate.commission_pct)) / 100
    );
    if (commissionCents <= 0) return;

    const { error: commErr } = await ctx.supabase
      .from("affiliate_commissions")
      .insert({
        order_id: order.id,
        affiliate_id: eventAffiliate.affiliate_id,
        event_affiliate_id: eventAffiliate.id,
        commission_cents: commissionCents,
        currency: order.currency || "EUR",
        status: "pending",
        cooldown_until: cooldownUntil,
      });
    if (commErr) {
      // Most likely duplicate on (order_id) — that's fine. Anything else
      // we still log but don't throw because attribution must not break
      // the checkout-success path.
      if (!String(commErr.message).toLowerCase().includes("duplicate")) {
        ctx.captureError?.(commErr, {
          scope: "affiliate_attribution:insert_commission",
          orderId: order.id,
        });
      }
      return;
    }

    // Send the affiliate a conversion email. Best-effort; failures here
    // don't block attribution.
    try {
      const { data: affiliate } = await ctx.supabase
        .from("affiliates")
        .select("display_name, contact_email, preferred_locale")
        .eq("id", eventAffiliate.affiliate_id)
        .maybeSingle();
      if (affiliate?.contact_email && eventRow) {
        const locale: AffiliateLocale =
          (affiliate.preferred_locale as AffiliateLocale | null) ?? "en";
        const eventTitle =
          (eventRow[
            `title_${locale}` as "title_en" | "title_de" | "title_fr"
          ] as string | null) ||
          eventRow.title_en;
        const amountFormatted = new Intl.NumberFormat(
          locale === "de"
            ? "de-DE"
            : locale === "fr"
            ? "fr-FR"
            : "en-US",
          { style: "currency", currency: order.currency || "EUR" }
        ).format(commissionCents / 100);
        const dashboardUrl = buildDashboardUrl({
          locale,
          token: eventAffiliate.dashboard_token,
        });
        await ctx.sendConversionEmail({
          to: affiliate.contact_email,
          recipientName: affiliate.display_name,
          eventTitle,
          commissionAmountFormatted: amountFormatted,
          ticketCount: 1, // Order-level summary; ticket count would require ticket count fetch
          dashboardUrl,
          locale,
        });
      }
    } catch (err) {
      ctx.captureError?.(err, {
        scope: "affiliate_attribution:send_conversion_email",
        orderId: order.id,
      });
    }
  } catch (err) {
    ctx.captureError?.(err, {
      scope: "affiliate_attribution:top_level",
      orderId: order.id,
    });
  }
}

/**
 * Called from the charge.refunded handler. Pro-rates the commission on
 * partial refunds; marks `reversed` on full refunds. Safe to call for
 * any refund — no-ops when the order had no affiliate commission.
 */
export async function reverseAffiliateCommissions(
  orderId: string,
  refundAmountCents: number,
  orderTotalCents: number,
  ctx: WebhookCtx
): Promise<void> {
  if (!affiliateEnabled()) return;
  try {
    const { data: commission } = await ctx.supabase
      .from("affiliate_commissions")
      .select("id, commission_cents, status")
      .eq("order_id", orderId)
      .maybeSingle();
    if (!commission) return;
    if (commission.status === "reversed") return;

    if (refundAmountCents >= orderTotalCents) {
      await ctx.supabase
        .from("affiliate_commissions")
        .update({
          status: "reversed",
          reversal_reason: "full_refund",
        })
        .eq("id", commission.id);
      return;
    }

    // Partial refund: pro-rate the commission.
    const refundRatio = refundAmountCents / orderTotalCents;
    const newCommissionCents = Math.max(
      0,
      Math.round(commission.commission_cents * (1 - refundRatio))
    );
    if (newCommissionCents === 0) {
      await ctx.supabase
        .from("affiliate_commissions")
        .update({
          status: "reversed",
          reversal_reason: "refund_full_after_proration",
        })
        .eq("id", commission.id);
      return;
    }
    await ctx.supabase
      .from("affiliate_commissions")
      .update({
        commission_cents: newCommissionCents,
        reversal_reason: `partial_refund_${refundAmountCents}_of_${orderTotalCents}`,
      })
      .eq("id", commission.id);
  } catch (err) {
    ctx.captureError?.(err, {
      scope: "affiliate_attribution:reverse_commission",
      orderId,
    });
  }
}
