"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

export interface DashboardKpis {
  totalRevenueCents: number;
  ticketsSold: number;
  activeEventCount: number;
  checkInRate: number; // 0-100
  revenueByDay: { date: string; cents: number }[];
  checkInsByDay: { date: string; count: number }[];
  topEvents: { id: string; title: string; revenue: number; sold: number }[];
  range: { from: string; to: string };
}

function isoDay(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export async function getDashboardKpis(
  locale: string,
  opts?: { from?: string; to?: string }
): Promise<DashboardKpis> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const to = opts?.to ?? new Date().toISOString().slice(0, 10);
  const from =
    opts?.from ??
    new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const fromTs = new Date(`${from}T00:00:00.000Z`).toISOString();
  const toTs = new Date(`${to}T23:59:59.999Z`).toISOString();

  // Paid orders in the window
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_cents, created_at, event_id")
    .eq("status", "paid")
    .gte("created_at", fromTs)
    .lte("created_at", toTs);

  const totalRevenueCents = (paidOrders ?? []).reduce(
    (sum, o) => sum + o.total_cents,
    0
  );

  // Tickets sold in the window (by order created_at) — we use orders to filter, then count their tickets.
  const { count: ticketsSold } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromTs)
    .lte("created_at", toTs);

  // Active events (published, ending in future — always "now" regardless of range)
  const { count: activeEventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .gte("ends_at", new Date().toISOString());

  // Check-in rate for tickets in the window
  const { count: totalTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromTs)
    .lte("created_at", toTs);

  const { count: checkedInTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromTs)
    .lte("created_at", toTs)
    .not("checked_in_at", "is", null);

  const checkInRate = totalTickets
    ? Math.round(((checkedInTickets ?? 0) / totalTickets) * 100)
    : 0;

  // Revenue by day — one entry per day across the full window (zero-filled)
  const revenueMap = new Map<string, number>();
  for (const order of paidOrders ?? []) {
    const key = isoDay(order.created_at);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + order.total_cents);
  }

  // Check-ins by day
  const { data: checkInTickets } = await supabase
    .from("tickets")
    .select("checked_in_at")
    .gte("checked_in_at", fromTs)
    .lte("checked_in_at", toTs)
    .not("checked_in_at", "is", null);
  const checkInMap = new Map<string, number>();
  for (const t of checkInTickets ?? []) {
    if (!t.checked_in_at) continue;
    const key = isoDay(t.checked_in_at);
    checkInMap.set(key, (checkInMap.get(key) ?? 0) + 1);
  }

  const revenueByDay: { date: string; cents: number }[] = [];
  const checkInsByDay: { date: string; count: number }[] = [];
  const startDate = new Date(`${from}T00:00:00.000Z`);
  const endDate = new Date(`${to}T00:00:00.000Z`);
  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const key = d.toISOString().slice(0, 10);
    revenueByDay.push({ date: key, cents: revenueMap.get(key) ?? 0 });
    checkInsByDay.push({ date: key, count: checkInMap.get(key) ?? 0 });
  }

  // Top events by revenue within the window
  const eventRevenue = new Map<string, { revenue: number; sold: number }>();
  for (const order of paidOrders ?? []) {
    const existing = eventRevenue.get(order.event_id) ?? { revenue: 0, sold: 0 };
    existing.revenue += order.total_cents;
    eventRevenue.set(order.event_id, existing);
  }
  const { data: ticketsByEvent } = await supabase
    .from("tickets")
    .select("event_id")
    .gte("created_at", fromTs)
    .lte("created_at", toTs);
  for (const t of ticketsByEvent ?? []) {
    const existing = eventRevenue.get(t.event_id) ?? { revenue: 0, sold: 0 };
    existing.sold += 1;
    eventRevenue.set(t.event_id, existing);
  }
  const topEventIds = Array.from(eventRevenue.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topEventData } = topEventIds.length
    ? await supabase
        .from("events")
        .select("id, title_en, title_de, title_fr")
        .in("id", topEventIds)
    : { data: [] };

  const topEvents = topEventIds
    .map((id) => {
      const event = topEventData?.find((e) => e.id === id);
      const stats = eventRevenue.get(id)!;
      return {
        id,
        title: event
          ? ((event[`title_${locale}` as keyof typeof event] as string) ||
            event.title_en)
          : "\u2014",
        revenue: stats.revenue,
        sold: stats.sold,
      };
    })
    .filter((e) => e.title !== "\u2014");

  return {
    totalRevenueCents,
    ticketsSold: ticketsSold ?? 0,
    activeEventCount: activeEventCount ?? 0,
    checkInRate,
    revenueByDay,
    checkInsByDay,
    topEvents,
    range: { from, to },
  };
}
