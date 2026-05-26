"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import {
  affiliateEnabled,
  buildDashboardUrl,
  buildReferralUrl,
  type AffiliateLocale,
} from "@dbc/affiliate";
import {
  createAffiliate as createAffiliateImpl,
  updateAffiliate as updateAffiliateImpl,
  listAffiliates as listAffiliatesImpl,
  getAffiliate as getAffiliateImpl,
  listEventAffiliates as listEventAffiliatesImpl,
  enrollAffiliateInEvent as enrollAffiliateInEventImpl,
  rotateDashboardToken as rotateDashboardTokenImpl,
  revokeDashboardToken as revokeDashboardTokenImpl,
  extendTokenExpiry as extendTokenExpiryImpl,
  updateEventAffiliate as updateEventAffiliateImpl,
  listEligiblePayoutAggregates as listEligiblePayoutAggregatesImpl,
  createPayoutForAffiliate as createPayoutForAffiliateImpl,
  markPayoutPaid as markPayoutPaidImpl,
  cancelPayout as cancelPayoutImpl,
  listPayoutsForAffiliate as listPayoutsForAffiliateImpl,
  generateAffiliateStatementPdf,
} from "@dbc/affiliate/server";
import {
  sendAffiliateWelcome,
  sendAffiliatePayoutStatement,
} from "@dbc/email";
import { syncCouponToStripe } from "@/lib/stripe-sync";

async function guard() {
  if (!affiliateEnabled()) {
    throw new Error("Affiliate program is disabled");
  }
  await requireRole("manager");
}

export async function createAffiliateAction(input: {
  display_name: string;
  contact_email: string;
  preferred_locale?: AffiliateLocale;
  country?: string | null;
  notes?: string | null;
}) {
  await guard();
  const supabase = await createServerClient();
  const row = await createAffiliateImpl(supabase, input);
  revalidatePath("/[locale]/affiliates", "page");
  return row;
}

export async function updateAffiliateAction(
  id: string,
  patch: {
    display_name?: string;
    contact_email?: string;
    preferred_locale?: AffiliateLocale;
    country?: string | null;
    notes?: string | null;
    status?: "invited" | "active" | "paused" | "terminated";
  }
) {
  await guard();
  const supabase = await createServerClient();
  const row = await updateAffiliateImpl(supabase, id, patch);
  revalidatePath(`/[locale]/affiliates/${id}`, "page");
  revalidatePath("/[locale]/affiliates", "page");
  return row;
}

export async function listAffiliatesAction() {
  await guard();
  const supabase = await createServerClient();
  return listAffiliatesImpl(supabase);
}

export async function getAffiliateAction(id: string) {
  await guard();
  const supabase = await createServerClient();
  return getAffiliateImpl(supabase, id);
}

export async function listEventAffiliatesAction(eventId: string) {
  await guard();
  const supabase = await createServerClient();
  return listEventAffiliatesImpl(supabase, eventId);
}

export async function enrollAffiliateAction(input: {
  affiliateId: string;
  eventId: string;
  commissionPct: number;
  couponCode: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  applicableTierIds?: string[] | null;
}) {
  await guard();
  const supabase = await createServerClient();

  // Fetch the event for the welcome email + dashboard URL.
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, ends_at, title_en, title_de, title_fr")
    .eq("id", input.eventId)
    .maybeSingle();
  if (!event) throw new Error("Event not found");

  // Fetch affiliate for email + locale.
  const affiliate = await getAffiliateImpl(supabase, input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found");
  const locale = (affiliate.preferred_locale as AffiliateLocale) ?? "en";

  const result = await enrollAffiliateInEventImpl(supabase, input, {
    eventEndsAt: event.ends_at,
    eventSlug: event.slug,
    locale,
  });

  // Sync coupon to Stripe (best-effort).
  try {
    const { data: couponRow } = await supabase
      .from("coupons")
      .select(
        "id, code, discount_type, discount_value, max_uses, valid_until, is_active, stripe_coupon_id, stripe_promotion_code_id, event_id"
      )
      .eq("id", result.couponId)
      .single();
    if (couponRow) {
      await syncCouponToStripe({
        id: couponRow.id,
        code: couponRow.code,
        discount_type: couponRow.discount_type,
        discount_value: couponRow.discount_value,
        max_uses: couponRow.max_uses,
        valid_until: couponRow.valid_until,
        is_active: couponRow.is_active,
        stripe_coupon_id: couponRow.stripe_coupon_id,
        stripe_promotion_code_id: couponRow.stripe_promotion_code_id,
        event_id: couponRow.event_id,
      });
    }
  } catch (err) {
    console.error("[enrollAffiliateAction] stripe sync failed", err);
  }

  // Send welcome email with both links.
  const eventTitle =
    (locale === "de" && event.title_de) ||
    (locale === "fr" && event.title_fr) ||
    event.title_en;
  try {
    await sendAffiliateWelcome({
      to: affiliate.contact_email,
      recipientName: affiliate.display_name,
      eventTitle,
      commissionPct: input.commissionPct,
      couponCode: result.couponCode,
      referralUrl: result.referralUrl,
      dashboardUrl: result.dashboardUrl,
      locale,
    });
  } catch (err) {
    console.error("[enrollAffiliateAction] welcome email failed", err);
  }

  revalidatePath(`/[locale]/events/${input.eventId}/affiliates`, "page");
  revalidatePath(`/[locale]/affiliates/${input.affiliateId}`, "page");
  return result;
}

export async function rotateAffiliateTokenAction(
  eventAffiliateId: string,
  eventId: string
) {
  await guard();
  const supabase = await createServerClient();
  const result = await rotateDashboardTokenImpl(supabase, eventAffiliateId);

  // Resend welcome email with the new link.
  const { data: ea } = await supabase
    .from("event_affiliates")
    .select(
      `affiliate_id, commission_pct, coupon_id,
       affiliates ( display_name, contact_email, preferred_locale ),
       events ( title_en, title_de, title_fr, slug ),
       coupons ( code )`
    )
    .eq("id", eventAffiliateId)
    .maybeSingle();
  if (ea) {
    const aff = ea.affiliates as unknown as {
      display_name: string;
      contact_email: string;
      preferred_locale: AffiliateLocale | null;
    };
    const ev = ea.events as unknown as {
      title_en: string;
      title_de: string | null;
      title_fr: string | null;
      slug: string;
    };
    const cp = ea.coupons as unknown as { code: string };
    const locale = (aff?.preferred_locale as AffiliateLocale) ?? "en";
    const eventTitle =
      (locale === "de" && ev.title_de) ||
      (locale === "fr" && ev.title_fr) ||
      ev.title_en;
    try {
      await sendAffiliateWelcome({
        to: aff.contact_email,
        recipientName: aff.display_name,
        eventTitle,
        commissionPct: Number(ea.commission_pct),
        couponCode: cp.code,
        referralUrl: buildReferralUrl({
          locale,
          eventSlug: ev.slug,
          couponCode: cp.code,
        }),
        dashboardUrl: buildDashboardUrl({ locale, token: result.token }),
        locale,
      });
    } catch (err) {
      console.error("[rotateAffiliateTokenAction] email failed", err);
    }
  }

  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
  return result;
}

export async function revokeAffiliateTokenAction(
  eventAffiliateId: string,
  eventId: string
) {
  await guard();
  const supabase = await createServerClient();
  await revokeDashboardTokenImpl(supabase, eventAffiliateId);
  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
}

export async function extendAffiliateTokenAction(
  eventAffiliateId: string,
  eventId: string,
  extraDays: number
) {
  await guard();
  const supabase = await createServerClient();
  const result = await extendTokenExpiryImpl(supabase, eventAffiliateId, extraDays);
  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
  return result;
}

export async function updateEventAffiliateAction(
  eventAffiliateId: string,
  eventId: string,
  patch: { commission_pct?: number; status?: "active" | "paused" | "ended" }
) {
  await guard();
  const supabase = await createServerClient();
  await updateEventAffiliateImpl(supabase, eventAffiliateId, patch);
  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
}

export async function listEligiblePayoutAggregatesAction() {
  await guard();
  const supabase = await createServerClient();
  return listEligiblePayoutAggregatesImpl(supabase);
}

export async function createAndSendPayoutAction(input: {
  affiliateId: string;
  periodLabel: string;
  notes?: string;
}) {
  await guard();
  const supabase = await createServerClient();
  const affiliate = await getAffiliateImpl(supabase, input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found");
  const locale = (affiliate.preferred_locale as AffiliateLocale) ?? "en";

  const payout = await createPayoutForAffiliateImpl(supabase, {
    affiliate_id: input.affiliateId,
    period_label: input.periodLabel,
    notes: input.notes,
  });

  // Fetch line items (commissions just queued).
  const { data: commissions } = await supabase
    .from("affiliate_commissions")
    .select(
      `id, commission_cents, created_at, event_affiliate_id,
       event_affiliates ( events ( title_en, title_de, title_fr ) )`
    )
    .eq("payout_id", payout.payout_id);

  const lineItems = (commissions ?? []).map((c) => {
    const eaWrap = c.event_affiliates as unknown as {
      events?: {
        title_en: string;
        title_de: string | null;
        title_fr: string | null;
      };
    };
    const events = eaWrap?.events;
    const eventTitle = events
      ? (locale === "de" && events.title_de) ||
        (locale === "fr" && events.title_fr) ||
        events.title_en
      : "—";
    return {
      date: new Date(c.created_at as string).toLocaleDateString(
        locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB"
      ),
      description: eventTitle,
      amount_formatted: new Intl.NumberFormat(
        locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
        { style: "currency", currency: payout.currency }
      ).format((c.commission_cents as number) / 100),
    };
  });

  const totalFormatted = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
    { style: "currency", currency: payout.currency }
  ).format(payout.amount_cents / 100);

  // Generate statement PDF.
  const pdfBuffer = await generateAffiliateStatementPdf({
    locale,
    statementNumber: payout.payout_id.slice(0, 8).toUpperCase(),
    payeeName: affiliate.display_name,
    payeeEmail: affiliate.contact_email,
    periodLabel: input.periodLabel,
    totalCents: payout.amount_cents,
    currency: payout.currency,
    paymentReference: null,
    paymentDate: null,
    lineItems,
  });

  // Upload to Supabase Storage.
  const path = `${input.affiliateId}/${payout.payout_id}.pdf`;
  const { error: uploadErr } = await supabase.storage
    .from("affiliate-statements")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadErr) {
    console.error("[createAndSendPayoutAction] PDF upload failed", uploadErr);
  } else {
    await supabase
      .from("affiliate_payouts")
      .update({ statement_storage_path: path })
      .eq("id", payout.payout_id);
  }

  // Send payout email with PDF attachment.
  try {
    await sendAffiliatePayoutStatement({
      to: affiliate.contact_email,
      recipientName: affiliate.display_name,
      amountFormatted: totalFormatted,
      periodLabel: input.periodLabel,
      paymentReference: null,
      dashboardUrl: null,
      pdfAttachment: {
        filename: `dbc-affiliate-statement-${input.periodLabel
          .replace(/\s+/g, "-")
          .toLowerCase()}.pdf`,
        content: pdfBuffer,
      },
      locale,
    });
  } catch (err) {
    console.error("[createAndSendPayoutAction] email failed", err);
  }

  // Audit log (no PII).
  await supabase.from("audit_log").insert({
    action: "affiliate_payout_created",
    entity_type: "affiliate_payouts",
    entity_id: payout.payout_id,
    details: {
      affiliate_id: input.affiliateId,
      amount_cents: payout.amount_cents,
      commission_count: payout.commission_count,
    },
  });

  revalidatePath("/[locale]/affiliates/payouts", "page");
  revalidatePath(`/[locale]/affiliates/${input.affiliateId}`, "page");
  return payout;
}

export async function markPayoutPaidAction(input: {
  payout_id: string;
  payment_reference: string;
}) {
  await guard();
  const supabase = await createServerClient();
  await markPayoutPaidImpl(supabase, input);
  await supabase.from("audit_log").insert({
    action: "affiliate_payout_paid",
    entity_type: "affiliate_payouts",
    entity_id: input.payout_id,
    details: { payment_reference: input.payment_reference },
  });
  revalidatePath("/[locale]/affiliates/payouts", "page");
}

export async function cancelPayoutAction(payoutId: string) {
  await guard();
  const supabase = await createServerClient();
  await cancelPayoutImpl(supabase, payoutId);
  revalidatePath("/[locale]/affiliates/payouts", "page");
}

export async function listPayoutsForAffiliateAction(affiliateId: string) {
  await guard();
  const supabase = await createServerClient();
  return listPayoutsForAffiliateImpl(supabase, affiliateId);
}
