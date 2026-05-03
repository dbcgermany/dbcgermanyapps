"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

export interface RevenueByTier {
  tier_id: string;
  tier_name: string;
  tickets_sold: number;
  revenue_cents: number;
}

export interface LiveEventStats {
  totalTickets: number;
  checkedIn: number;
  checkedInPct: number;
  revenueCents: number;
  ordersByMethod: { payment_method: string; count: number }[];
  recentCheckIns: { attendee_name: string; checked_in_at: string }[];
  revenueByTier: RevenueByTier[];
}

export async function getLiveEventStats(
  eventId: string
): Promise<LiveEventStats> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const [totalRes, checkedInRes, revenueRes, methodRawRes, recentRes, perTierRes] =
    await Promise.all([
      // Total tickets (paid/comped only — abandoned carts shouldn't
      // show up on the live event operator screen as "capacity used").
      supabase
        .from("tickets")
        .select("id, orders!inner(status)", { count: "exact", head: true })
        .in("orders.status", ["paid", "comped"])
        .eq("event_id", eventId),

      // Checked in
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .not("checked_in_at", "is", null),

      // Revenue
      supabase
        .from("orders")
        .select("total_cents")
        .eq("event_id", eventId)
        .in("status", ["paid", "comped"]),

      // Orders by payment method (raw rows, aggregated below)
      supabase
        .from("orders")
        .select("payment_method")
        .eq("event_id", eventId)
        .in("status", ["paid", "comped"]),

      // Last 10 check-ins
      supabase
        .from("tickets")
        .select("attendee_name, checked_in_at")
        .eq("event_id", eventId)
        .not("checked_in_at", "is", null)
        .order("checked_in_at", { ascending: false })
        .limit(10),

      // Per-tier breakdown: tickets sold + revenue grouped by tier. We
      // aggregate in JS rather than via a Postgres view so admins can
      // see tiers that exist but haven't sold yet (zero rows on the join).
      // tier price comes from ticket_tiers.price_cents — using order
      // discount_cents would double-count when the same coupon spans
      // multiple tiers in one order.
      supabase
        .from("tickets")
        .select("tier_id, orders!inner(status), ticket_tiers!inner(name_en, name_de, name_fr, price_cents)")
        .in("orders.status", ["paid", "comped"])
        .eq("event_id", eventId),
    ]);

  const totalTickets = totalRes.count ?? 0;
  const checkedIn = checkedInRes.count ?? 0;
  const revenueCents = (revenueRes.data ?? []).reduce(
    (sum, o) => sum + (o.total_cents ?? 0),
    0
  );

  // Aggregate orders by payment method
  const methodCounts = new Map<string, number>();
  for (const row of methodRawRes.data ?? []) {
    const method = (row.payment_method as string) || "unknown";
    methodCounts.set(method, (methodCounts.get(method) ?? 0) + 1);
  }
  const ordersByMethod = Array.from(methodCounts.entries())
    .map(([payment_method, count]) => ({ payment_method, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate per-tier counts + revenue. Supabase typegen models inner-join
  // relations as arrays even when 1:1, so we accept either shape and unwrap.
  type TierData = {
    name_en: string;
    name_de: string | null;
    name_fr: string | null;
    price_cents: number;
  };
  type TierJoinRow = {
    tier_id: string;
    ticket_tiers: TierData | TierData[] | null;
  };
  const tierAcc = new Map<
    string,
    { tier_name: string; tickets: number; revenue: number }
  >();
  for (const row of (perTierRes.data ?? []) as unknown as TierJoinRow[]) {
    const tierRel = Array.isArray(row.ticket_tiers)
      ? row.ticket_tiers[0]
      : row.ticket_tiers;
    if (!tierRel) continue;
    const existing = tierAcc.get(row.tier_id);
    const tierName =
      tierRel.name_en ?? tierRel.name_de ?? tierRel.name_fr ?? "Tier";
    if (existing) {
      existing.tickets += 1;
      existing.revenue += tierRel.price_cents ?? 0;
    } else {
      tierAcc.set(row.tier_id, {
        tier_name: tierName,
        tickets: 1,
        revenue: tierRel.price_cents ?? 0,
      });
    }
  }
  const revenueByTier: RevenueByTier[] = Array.from(tierAcc.entries())
    .map(([tier_id, v]) => ({
      tier_id,
      tier_name: v.tier_name,
      tickets_sold: v.tickets,
      revenue_cents: v.revenue,
    }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents);

  return {
    totalTickets,
    checkedIn,
    checkedInPct: totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0,
    revenueCents,
    ordersByMethod,
    recentCheckIns: (recentRes.data ?? []) as {
      attendee_name: string;
      checked_in_at: string;
    }[],
    revenueByTier,
  };
}
