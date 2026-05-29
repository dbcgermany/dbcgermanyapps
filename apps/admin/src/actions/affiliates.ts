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
  setTierGoalsForEnrollment as setTierGoalsImpl,
  getGoalProgressForEnrollment as getGoalProgressImpl,
  fulfillTierGoal as fulfillTierGoalImpl,
  unfulfillTierGoal as unfulfillTierGoalImpl,
  listReachedUnfulfilledGoals as listReachedGoalsImpl,
  type GoalRuleInput,
} from "@dbc/affiliate/server";
import {
  sendAffiliateWelcome,
  sendAffiliatePayoutStatement,
} from "@dbc/email";
import { CONTACT_CATEGORY } from "@dbc/types";
import { syncCouponToStripe } from "@/lib/stripe-sync";

/**
 * Contact is king: every affiliate is a person in the `contacts` SSOT. Resolve
 * (find-or-create by email) the contact via the canonical upsert RPC and tag it
 * with the `affiliate` category so they're filterable in the Contacts list.
 * Returns the contact id to store on affiliates.contact_id. Runs BEFORE the
 * affiliate row is written so we never create an affiliate without its contact.
 */
async function linkAffiliateContact(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  args: {
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    country?: string | null;
    locale?: AffiliateLocale | null;
  }
): Promise<string | null> {
  const { data, error } = await supabase.rpc("upsert_contact_from_checkout", {
    p_email: args.email,
    p_first_name: args.first_name ?? null,
    p_last_name: args.last_name ?? null,
    p_country: args.country ?? null,
    p_locale: args.locale ?? null,
    p_auto_category_slug: CONTACT_CATEGORY.affiliate,
  });
  if (error) throw new Error(`Could not link affiliate to a contact: ${error.message}`);
  return (data as string | null) ?? null;
}

function deriveDisplayName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null
): string {
  const joined = [first, last]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return joined || (fallback ?? "").trim();
}

async function guard() {
  if (!affiliateEnabled()) {
    throw new Error("Affiliate program is disabled");
  }
  await requireRole("manager");
}

export async function createAffiliateAction(input: {
  first_name: string;
  last_name?: string | null;
  contact_email: string;
  preferred_locale?: AffiliateLocale;
  country?: string | null;
  notes?: string | null;
  // Back-compat: older callers may still pass a single display_name.
  display_name?: string;
}) {
  await guard();
  const supabase = await createServerClient();

  const first = (input.first_name ?? "").trim();
  const last = (input.last_name ?? "").trim();
  const display_name = deriveDisplayName(first, last, input.display_name);
  if (!display_name) throw new Error("Affiliate name is required");
  const email = input.contact_email.trim().toLowerCase();

  // Resolve/create the contact first — an affiliate must always be a contact.
  const contactId = await linkAffiliateContact(supabase, {
    email,
    first_name: first || null,
    last_name: last || null,
    country: input.country ?? null,
    locale: input.preferred_locale ?? null,
  });

  const row = await createAffiliateImpl(supabase, {
    display_name,
    contact_email: email,
    preferred_locale: input.preferred_locale,
    country: input.country ?? null,
    notes: input.notes ?? null,
    first_name: first || null,
    last_name: last || null,
    contact_id: contactId,
  });
  revalidatePath("/[locale]/affiliates", "page");
  return row;
}

export async function updateAffiliateAction(
  id: string,
  patch: {
    first_name?: string | null;
    last_name?: string | null;
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

  const next: Record<string, unknown> = { ...patch };
  const nameEdited =
    patch.first_name !== undefined || patch.last_name !== undefined;
  if (nameEdited) {
    const first = (patch.first_name ?? "").trim();
    const last = (patch.last_name ?? "").trim();
    next.first_name = first || null;
    next.last_name = last || null;
    const dn = deriveDisplayName(first, last);
    if (dn) next.display_name = dn;
  }

  // Keep the linked contact in sync when the name or email changes.
  if (nameEdited || patch.contact_email !== undefined) {
    const current = await getAffiliateImpl(supabase, id);
    const email = (patch.contact_email ?? current?.contact_email ?? "")
      .trim()
      .toLowerCase();
    if (email) {
      const contactId = await linkAffiliateContact(supabase, {
        email,
        first_name:
          (next.first_name as string | null | undefined) ??
          current?.first_name ??
          null,
        last_name:
          (next.last_name as string | null | undefined) ??
          current?.last_name ??
          null,
        country: patch.country ?? current?.country ?? null,
        locale:
          (patch.preferred_locale ??
            (current?.preferred_locale as AffiliateLocale | undefined)) ??
          null,
      });
      if (contactId) next.contact_id = contactId;
      if (patch.contact_email !== undefined) next.contact_email = email;
    }
  }

  const row = await updateAffiliateImpl(
    supabase,
    id,
    next as Parameters<typeof updateAffiliateImpl>[2]
  );
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

export async function listEventAffiliatesAction(
  eventId: string,
  eventSlug: string
) {
  await guard();
  const supabase = await createServerClient();
  return listEventAffiliatesImpl(supabase, eventId, { eventSlug });
}

export async function enrollAffiliateAction(input: {
  affiliateId: string;
  eventId: string;
  commissionPct: number;
  coupon?: {
    code: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    applicableTierIds?: string[] | null;
  } | null;
  tokenExpiresAt?: string | null;
  tierGoals?: GoalRuleInput[] | null;
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

  // Sync coupon to Stripe (best-effort). Only when a coupon was actually
  // created for this enrollment.
  if (result.couponId) {
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
  }

  // Send welcome email with both links.
  const eventTitle =
    (locale === "de" && event.title_de) ||
    (locale === "fr" && event.title_fr) ||
    event.title_en;
  // Build goal labels for the welcome email (resolve tier names by id).
  let goalsForEmail:
    | Array<{
        target_count: number;
        tier_name: string;
        reward_count: number;
        reward_tier_name: string;
      }>
    | null = null;
  if (input.tierGoals && input.tierGoals.length > 0) {
    const tierIds = Array.from(
      new Set(
        input.tierGoals.flatMap((g) => [g.tier_id, g.reward_tier_id])
      )
    );
    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select("id, name_en, name_de, name_fr")
      .in("id", tierIds);
    const nameById = new Map<string, string>();
    for (const t of tiers ?? []) {
      const name =
        (locale === "de" && t.name_de) ||
        (locale === "fr" && t.name_fr) ||
        t.name_en;
      nameById.set(t.id, name);
    }
    goalsForEmail = input.tierGoals.map((g) => ({
      target_count: g.target_count,
      tier_name: nameById.get(g.tier_id) ?? "—",
      reward_count: g.reward_count,
      reward_tier_name: nameById.get(g.reward_tier_id) ?? "—",
    }));
  }

  try {
    await sendAffiliateWelcome({
      to: affiliate.contact_email,
      recipientName: affiliate.display_name,
      eventTitle,
      commissionPct: input.commissionPct,
      couponCode: result.couponCode,
      goals: goalsForEmail,
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
      `affiliate_id, commission_pct, coupon_id, tracking_tag,
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
    const cp = ea.coupons as unknown as { code: string } | null;
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
        couponCode: cp?.code ?? null,
        referralUrl: buildReferralUrl({
          locale,
          eventSlug: ev.slug,
          trackingTag: ea.tracking_tag,
          couponCode: cp?.code ?? null,
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

// ----- Tier goals (free-ticket rewards) -----

export async function setTierGoalsAction(
  eventAffiliateId: string,
  eventId: string,
  rules: GoalRuleInput[]
) {
  await guard();
  const supabase = await createServerClient();
  await setTierGoalsImpl(supabase, eventAffiliateId, rules);
  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
}

export async function getGoalProgressAction(eventAffiliateId: string) {
  await guard();
  const supabase = await createServerClient();
  return getGoalProgressImpl(supabase, eventAffiliateId);
}

export async function fulfillTierGoalAction(
  goalId: string,
  notes: string,
  eventId: string
) {
  await guard();
  const supabase = await createServerClient();
  await fulfillTierGoalImpl(supabase, goalId, notes);
  await supabase.from("audit_log").insert({
    action: "affiliate_goal_fulfilled",
    entity_type: "event_affiliate_tier_goals",
    entity_id: goalId,
    details: { notes },
  });
  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
}

export async function unfulfillTierGoalAction(
  goalId: string,
  eventId: string
) {
  await guard();
  const supabase = await createServerClient();
  await unfulfillTierGoalImpl(supabase, goalId);
  revalidatePath(`/[locale]/events/${eventId}/affiliates`, "page");
}

export async function listReachedGoalsAction(eventId: string) {
  await guard();
  const supabase = await createServerClient();
  return listReachedGoalsImpl(supabase, eventId);
}
