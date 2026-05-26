/**
 * Admin-only payout management: aggregate eligible commissions per
 * affiliate, generate the payout row + statement PDF, send the email.
 *
 * Workflow:
 *   1. listEligiblePayoutAggregates() — show admin who has earnings
 *   2. createPayoutForAffiliate() — group all eligible commissions into one
 *      payout, mark them payout_queued, generate PDF, send email
 *   3. markPayoutPaid() — admin confirms bank transfer landed, with reference
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateLocale } from "../types";

export interface EligibleAggregate {
  affiliate_id: string;
  affiliate: {
    display_name: string;
    contact_email: string;
    preferred_locale: AffiliateLocale | null;
  };
  total_cents: number;
  commission_count: number;
}

export async function listEligiblePayoutAggregates(
  supabase: SupabaseClient
): Promise<EligibleAggregate[]> {
  const { data: rows, error } = await supabase
    .from("affiliate_commissions")
    .select(
      `affiliate_id, commission_cents,
       affiliates ( display_name, contact_email, preferred_locale )`
    )
    .eq("status", "eligible");
  if (error) throw new Error(`listEligiblePayoutAggregates: ${error.message}`);

  const map = new Map<string, EligibleAggregate>();
  for (const row of rows ?? []) {
    const id = row.affiliate_id as string;
    const aff = row.affiliates as unknown as EligibleAggregate["affiliate"];
    const existing = map.get(id);
    if (existing) {
      existing.total_cents += row.commission_cents as number;
      existing.commission_count += 1;
    } else {
      map.set(id, {
        affiliate_id: id,
        affiliate: {
          display_name: aff?.display_name ?? "",
          contact_email: aff?.contact_email ?? "",
          preferred_locale:
            (aff?.preferred_locale as AffiliateLocale | null) ?? null,
        },
        total_cents: row.commission_cents as number,
        commission_count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total_cents - a.total_cents);
}

export interface CreatePayoutInput {
  affiliate_id: string;
  period_label?: string;
  notes?: string;
}

export interface CreatePayoutResult {
  payout_id: string;
  amount_cents: number;
  currency: string;
  commission_count: number;
}

/**
 * Create a payout row aggregating all currently-eligible commissions for
 * the affiliate, mark those commissions as payout_queued. Statement PDF
 * generation and email are deferred to a separate step so admin can
 * preview before sending.
 */
export async function createPayoutForAffiliate(
  supabase: SupabaseClient,
  input: CreatePayoutInput
): Promise<CreatePayoutResult> {
  const { data: eligibles, error: eligErr } = await supabase
    .from("affiliate_commissions")
    .select("id, commission_cents, currency")
    .eq("affiliate_id", input.affiliate_id)
    .eq("status", "eligible");
  if (eligErr) throw new Error(`createPayout: list eligibles: ${eligErr.message}`);
  if (!eligibles || eligibles.length === 0) {
    throw new Error("createPayout: no eligible commissions");
  }

  type EligibleRow = {
    id: string;
    commission_cents: number;
    currency: string;
  };
  const rows = eligibles as EligibleRow[];
  const totalCents = rows.reduce((sum, c) => sum + c.commission_cents, 0);
  const currency = rows[0].currency ?? "EUR";

  const { data: payout, error: payoutErr } = await supabase
    .from("affiliate_payouts")
    .insert({
      affiliate_id: input.affiliate_id,
      status: "approved",
      amount_cents: totalCents,
      currency,
      notes: input.notes ?? null,
      period_starts_at: null,
      period_ends_at: null,
    })
    .select("id")
    .single();
  if (payoutErr || !payout)
    throw new Error(`createPayout: insert: ${payoutErr?.message ?? "unknown"}`);

  const ids = rows.map((c) => c.id);
  const { error: updErr } = await supabase
    .from("affiliate_commissions")
    .update({ status: "payout_queued", payout_id: payout.id })
    .in("id", ids);
  if (updErr)
    throw new Error(`createPayout: update commissions: ${updErr.message}`);

  return {
    payout_id: payout.id,
    amount_cents: totalCents,
    currency,
    commission_count: eligibles.length,
  };
}

export interface MarkPayoutPaidInput {
  payout_id: string;
  payment_reference: string;
}

export async function markPayoutPaid(
  supabase: SupabaseClient,
  input: MarkPayoutPaidInput
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error: payoutErr } = await supabase
    .from("affiliate_payouts")
    .update({
      status: "paid",
      paid_at: nowIso,
      payment_reference: input.payment_reference,
      updated_at: nowIso,
    })
    .eq("id", input.payout_id);
  if (payoutErr) throw new Error(`markPayoutPaid: ${payoutErr.message}`);

  const { error: commErr } = await supabase
    .from("affiliate_commissions")
    .update({ status: "paid", updated_at: nowIso })
    .eq("payout_id", input.payout_id)
    .eq("status", "payout_queued");
  if (commErr) throw new Error(`markPayoutPaid: commissions: ${commErr.message}`);
}

export async function cancelPayout(
  supabase: SupabaseClient,
  payoutId: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  // Roll commissions back to eligible.
  const { error: commErr } = await supabase
    .from("affiliate_commissions")
    .update({ status: "eligible", payout_id: null, updated_at: nowIso })
    .eq("payout_id", payoutId)
    .eq("status", "payout_queued");
  if (commErr) throw new Error(`cancelPayout: commissions: ${commErr.message}`);
  const { error: payoutErr } = await supabase
    .from("affiliate_payouts")
    .update({ status: "cancelled", updated_at: nowIso })
    .eq("id", payoutId);
  if (payoutErr) throw new Error(`cancelPayout: payout: ${payoutErr.message}`);
}

export async function listPayoutsForAffiliate(
  supabase: SupabaseClient,
  affiliateId: string
) {
  const { data, error } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listPayoutsForAffiliate: ${error.message}`);
  return data ?? [];
}
