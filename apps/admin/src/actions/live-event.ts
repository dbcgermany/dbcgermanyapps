"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  REAL_ORDER_ACQUISITION_TYPES,
  ALLOCATION_ACQUISITION_TYPES,
} from "@/lib/order-kinds";

export interface RevenueByTier {
  tier_id: string;
  tier_name: string;
  tickets_sold: number;
  revenue_cents: number;
}

export interface LiveEventStats {
  // Tickets sold via checkout or door-sale. Real orders only.
  ticketsSold: number;
  // Tickets allocated via invitation or team/companion assignment.
  // These never count as "sold" but they do show up on the door (they scan
  // in like everyone else), so they're included in the check-in denominator.
  ticketsAllocated: number;
  // Sold + allocated. Replaces the old `totalTickets` semantic — what's the
  // total number of physical tickets that can walk through the door.
  totalTickets: number;
  checkedIn: number;
  // Percentage = checkedIn / totalTickets. Includes allocations in the
  // denominator since allocated guests do attend.
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

  const [
    soldRes,
    allocatedRes,
    checkedInRes,
    revenueRes,
    methodRawRes,
    recentRes,
    perTierRes,
  ] = await Promise.all([
      // Tickets SOLD — only counts real orders (purchased + door_sale).
      supabase
        .from("tickets")
        .select(
          "id, orders!inner(status, acquisition_type)",
          { count: "exact", head: true }
        )
        .in("orders.status", ["paid", "comped"])
        .in("orders.acquisition_type", [...REAL_ORDER_ACQUISITION_TYPES])
        .eq("event_id", eventId),

      // Tickets ALLOCATED — invitations + team/companion assignments.
      // Always counted, regardless of order status (these are always comped
      // in practice but we don't depend on it).
      supabase
        .from("tickets")
        .select(
          "id, orders!inner(acquisition_type)",
          { count: "exact", head: true }
        )
        .in("orders.acquisition_type", [...ALLOCATION_ACQUISITION_TYPES])
        .eq("event_id", eventId),

      // Checked in (regardless of acquisition type — allocated guests
      // do check in).
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .not("checked_in_at", "is", null),

      // Revenue — restricted to real orders. Allocations contribute €0
      // anyway, so this is mostly cosmetic, but it makes the KPI robust
      // against a future paid-but-allocated edge case.
      supabase
        .from("orders")
        .select("total_cents")
        .eq("event_id", eventId)
        .in("status", ["paid", "comped"])
        .in("acquisition_type", [...REAL_ORDER_ACQUISITION_TYPES]),

      // Orders by payment method — real orders only. Allocations have
      // payment_method=null and would dilute the "how are people paying?"
      // breakdown.
      supabase
        .from("orders")
        .select("payment_method")
        .eq("event_id", eventId)
        .in("status", ["paid", "comped"])
        .in("acquisition_type", [...REAL_ORDER_ACQUISITION_TYPES]),

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
      //
      // Real orders only — per-tier "tickets_sold" must match the
      // headline KPI definition.
      supabase
        .from("tickets")
        .select(
          "tier_id, orders!inner(status, acquisition_type), ticket_tiers!inner(name_en, name_de, name_fr, price_cents)"
        )
        .in("orders.status", ["paid", "comped"])
        .in("orders.acquisition_type", [...REAL_ORDER_ACQUISITION_TYPES])
        .eq("event_id", eventId),
    ]);

  const ticketsSold = soldRes.count ?? 0;
  const ticketsAllocated = allocatedRes.count ?? 0;
  const totalTickets = ticketsSold + ticketsAllocated;
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
    ticketsSold,
    ticketsAllocated,
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
