"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

export interface LiveEventStats {
  totalTickets: number;
  checkedIn: number;
  checkedInPct: number;
  revenueCents: number;
  ordersByMethod: { payment_method: string; count: number }[];
  recentCheckIns: { attendee_name: string; checked_in_at: string }[];
}

export async function getLiveEventStats(
  eventId: string
): Promise<LiveEventStats> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const [totalRes, checkedInRes, revenueRes, methodRawRes, recentRes] =
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
  };
}
