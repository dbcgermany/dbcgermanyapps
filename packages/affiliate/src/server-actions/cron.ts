/**
 * Daily cron: flip affiliate_commissions.status pending -> eligible once
 * the per-order cooldown window has passed. Idempotent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { affiliateEnabled } from "../feature-flag";

export interface CronResult {
  marked_eligible: number;
  skipped: number;
}

export async function runAffiliateCooldownCron(
  supabase: SupabaseClient
): Promise<CronResult> {
  if (!affiliateEnabled()) return { marked_eligible: 0, skipped: 0 };
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("affiliate_commissions")
    .update({ status: "eligible", updated_at: nowIso })
    .eq("status", "pending")
    .lte("cooldown_until", nowIso)
    .select("id");
  if (error) throw new Error(`runAffiliateCooldownCron: ${error.message}`);
  return { marked_eligible: (data ?? []).length, skipped: 0 };
}
