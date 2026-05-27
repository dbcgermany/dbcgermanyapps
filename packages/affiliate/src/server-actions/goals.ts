/**
 * Tier-goal CRUD + live progress computation. Goals are independent of
 * commissions and discount coupons — admin can set any combination per
 * enrollment, including ONLY goals (commission_pct = 0, no coupon).
 *
 * Progress is computed live from current valid tickets attributed to the
 * affiliate via affiliate_referrals → orders → tickets. Refunded/revoked
 * tickets do NOT count.
 *
 * Fulfillment is manual — once a goal is reached, admin sees it in the
 * 'to fulfill' queue and dispatches a coupon code outside the system,
 * then calls fulfillTierGoal() to mark done.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface TierGoalRow {
  id: string;
  event_affiliate_id: string;
  tier_id: string;
  target_count: number;
  reward_tier_id: string;
  reward_count: number;
  fulfilled_at: string | null;
  fulfilled_notes: string | null;
}

export interface TierGoalProgress extends TierGoalRow {
  current_count: number;
  reached: boolean;
  tier: { id: string; name: string } | null;
  reward_tier: { id: string; name: string } | null;
}

export interface GoalRuleInput {
  tier_id: string;
  target_count: number;
  reward_tier_id: string;
  reward_count: number;
}

/**
 * Replace all tier goals for an enrollment with the provided set. Goals
 * not in the new list are deleted; existing matched goals (by tier_id)
 * are updated; new tier_ids are inserted. Idempotent.
 */
export async function setTierGoalsForEnrollment(
  supabase: SupabaseClient,
  eventAffiliateId: string,
  rules: GoalRuleInput[]
): Promise<void> {
  // Delete goals whose tier_id is no longer in the new set.
  const tierIds = rules.map((r) => r.tier_id);
  if (tierIds.length === 0) {
    await supabase
      .from("event_affiliate_tier_goals")
      .delete()
      .eq("event_affiliate_id", eventAffiliateId);
    return;
  }
  const { error: delErr } = await supabase
    .from("event_affiliate_tier_goals")
    .delete()
    .eq("event_affiliate_id", eventAffiliateId)
    .not("tier_id", "in", `(${tierIds.map((t) => `"${t}"`).join(",")})`);
  if (delErr) throw new Error(`setTierGoals: delete: ${delErr.message}`);

  // Upsert each rule.
  for (const r of rules) {
    const { error } = await supabase
      .from("event_affiliate_tier_goals")
      .upsert(
        {
          event_affiliate_id: eventAffiliateId,
          tier_id: r.tier_id,
          target_count: r.target_count,
          reward_tier_id: r.reward_tier_id,
          reward_count: r.reward_count,
        },
        { onConflict: "event_affiliate_id,tier_id" }
      );
    if (error) throw new Error(`setTierGoals: upsert: ${error.message}`);
  }
}

/**
 * Live progress for a single enrollment's goals. Joins to ticket_tiers
 * for human-readable tier names. Counts only currently-valid tickets:
 *   - orders.status NOT IN ('refunded','cancelled','expired')
 *   - tickets.revoked_at IS NULL
 */
export async function getGoalProgressForEnrollment(
  supabase: SupabaseClient,
  eventAffiliateId: string
): Promise<TierGoalProgress[]> {
  const { data: goals } = await supabase
    .from("event_affiliate_tier_goals")
    .select(
      `id, event_affiliate_id, tier_id, target_count, reward_tier_id,
       reward_count, fulfilled_at, fulfilled_notes,
       tier:ticket_tiers!event_affiliate_tier_goals_tier_id_fkey
         ( id, name_en, name_de, name_fr ),
       reward_tier:ticket_tiers!event_affiliate_tier_goals_reward_tier_id_fkey
         ( id, name_en, name_de, name_fr )`
    )
    .eq("event_affiliate_id", eventAffiliateId);

  // Resolve referred order IDs, then count valid tickets per tier in
  // those orders. Refunded/cancelled/expired orders and revoked tickets
  // do NOT count toward goals (otherwise a refund could leave an affiliate
  // 'qualified' for a free ticket they didn't actually drive).
  const { data: refs } = await supabase
    .from("affiliate_referrals")
    .select("order_id")
    .eq("event_affiliate_id", eventAffiliateId);
  const orderIds = (refs ?? []).map((r) => r.order_id as string);

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
      if (!status || ["refunded", "cancelled", "expired"].includes(status))
        continue;
      countByTier.set(t.tier_id, (countByTier.get(t.tier_id) ?? 0) + 1);
    }
  }

  return ((goals ?? []) as unknown as Array<
    TierGoalRow & {
      tier: {
        id: string;
        name_en: string;
        name_de: string | null;
        name_fr: string | null;
      } | null;
      reward_tier: {
        id: string;
        name_en: string;
        name_de: string | null;
        name_fr: string | null;
      } | null;
    }
  >).map((g) => {
    const cur = countByTier.get(g.tier_id) ?? 0;
    return {
      id: g.id,
      event_affiliate_id: g.event_affiliate_id,
      tier_id: g.tier_id,
      target_count: g.target_count,
      reward_tier_id: g.reward_tier_id,
      reward_count: g.reward_count,
      fulfilled_at: g.fulfilled_at,
      fulfilled_notes: g.fulfilled_notes,
      current_count: cur,
      reached: cur >= g.target_count,
      tier: g.tier
        ? { id: g.tier.id, name: g.tier.name_en }
        : null,
      reward_tier: g.reward_tier
        ? { id: g.reward_tier.id, name: g.reward_tier.name_en }
        : null,
    };
  });
}

/**
 * Mark a goal fulfilled. Admin enters notes describing what they did
 * (e.g., 'Sent code STARTERFREE2026 via WhatsApp on 2026-05-27').
 */
export async function fulfillTierGoal(
  supabase: SupabaseClient,
  goalId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from("event_affiliate_tier_goals")
    .update({
      fulfilled_at: new Date().toISOString(),
      fulfilled_notes: notes,
    })
    .eq("id", goalId);
  if (error) throw new Error(`fulfillTierGoal: ${error.message}`);
}

/**
 * Unmark — in case admin clicked fulfilled by mistake.
 */
export async function unfulfillTierGoal(
  supabase: SupabaseClient,
  goalId: string
): Promise<void> {
  const { error } = await supabase
    .from("event_affiliate_tier_goals")
    .update({ fulfilled_at: null, fulfilled_notes: null })
    .eq("id", goalId);
  if (error) throw new Error(`unfulfillTierGoal: ${error.message}`);
}

/**
 * Admin queue: goals reached but not yet fulfilled, scoped to a single
 * event. Includes affiliate identity so admin can act.
 */
export interface ReachedGoalEntry {
  goal_id: string;
  event_affiliate_id: string;
  affiliate: { id: string; display_name: string; contact_email: string };
  tier_name: string;
  target_count: number;
  current_count: number;
  reward_tier_name: string;
  reward_count: number;
}

export async function listReachedUnfulfilledGoals(
  supabase: SupabaseClient,
  eventId: string
): Promise<ReachedGoalEntry[]> {
  const { data: rows } = await supabase
    .from("event_affiliate_tier_goals")
    .select(
      `id, event_affiliate_id, tier_id, target_count, reward_count,
       event_affiliates!inner ( id, event_id, affiliate_id,
         affiliates ( id, display_name, contact_email ) ),
       tier:ticket_tiers!event_affiliate_tier_goals_tier_id_fkey ( name_en ),
       reward_tier:ticket_tiers!event_affiliate_tier_goals_reward_tier_id_fkey ( name_en )`
    )
    .is("fulfilled_at", null)
    .eq("event_affiliates.event_id", eventId);

  if (!rows || rows.length === 0) return [];

  // For each row, count current valid tickets for that tier referred via
  // this enrollment. Cheap because the typical roster has < 50 goals.
  const out: ReachedGoalEntry[] = [];
  for (const r of rows as unknown as Array<{
    id: string;
    event_affiliate_id: string;
    tier_id: string;
    target_count: number;
    reward_count: number;
    event_affiliates: {
      id: string;
      affiliates: { id: string; display_name: string; contact_email: string } | null;
    };
    tier: { name_en: string } | null;
    reward_tier: { name_en: string } | null;
  }>) {
    const { data: refs } = await supabase
      .from("affiliate_referrals")
      .select("order_id")
      .eq("event_affiliate_id", r.event_affiliate_id);
    const orderIds = (refs ?? []).map((x) => x.order_id as string);
    let count = 0;
    if (orderIds.length > 0) {
      const { data: tickets } = await supabase
        .from("tickets")
        .select("tier_id, orders!inner ( status )")
        .in("order_id", orderIds)
        .eq("tier_id", r.tier_id)
        .is("revoked_at", null);
      for (const t of (tickets ?? []) as Array<{
        orders: { status: string } | { status: string }[] | null;
      }>) {
        const orderRow = Array.isArray(t.orders) ? t.orders[0] : t.orders;
        const status = orderRow?.status;
        if (!status || ["refunded", "cancelled", "expired"].includes(status))
          continue;
        count += 1;
      }
    }
    if (count >= r.target_count) {
      const aff = r.event_affiliates?.affiliates;
      out.push({
        goal_id: r.id,
        event_affiliate_id: r.event_affiliate_id,
        affiliate: aff
          ? {
              id: aff.id,
              display_name: aff.display_name,
              contact_email: aff.contact_email,
            }
          : { id: "", display_name: "—", contact_email: "" },
        tier_name: r.tier?.name_en ?? "—",
        target_count: r.target_count,
        current_count: count,
        reward_tier_name: r.reward_tier?.name_en ?? "—",
        reward_count: r.reward_count,
      });
    }
  }
  return out;
}
