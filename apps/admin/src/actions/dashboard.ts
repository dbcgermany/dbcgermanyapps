"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

export interface DashboardKpis {
  totalRevenueCents: number;
  ticketsSold: number;
  activeEventCount: number;
  checkInRate: number; // 0-100
  revenueByDay: { date: string; cents: number }[];
  topEvents: { id: string; title: string; revenue: number; sold: number }[];
}

export async function getDashboardKpis(locale: string): Promise<DashboardKpis> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  // Revenue: sum of paid orders
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_cents, created_at, event_id")
    .eq("status", "paid");

  const totalRevenueCents = (paidOrders ?? []).reduce(
    (sum, o) => sum + o.total_cents,
    0
  );

  // Tickets sold (paid + comped + door_sale)
  const { count: ticketsSold } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });

  // Active events (published, future)
  const { count: activeEventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .gte("ends_at", new Date().toISOString());

  // Check-in rate across all tickets
  const { count: totalTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });

  const { count: checkedInTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .not("checked_in_at", "is", null);

  const checkInRate = totalTickets
    ? Math.round(((checkedInTickets ?? 0) / totalTickets) * 100)
    : 0;

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const revenueMap = new Map<string, number>();
  for (const order of paidOrders ?? []) {
    if (new Date(order.created_at) < thirtyDaysAgo) continue;
    const dateKey = new Date(order.created_at).toISOString().slice(0, 10);
    revenueMap.set(dateKey, (revenueMap.get(dateKey) ?? 0) + order.total_cents);
  }
  const revenueByDay = Array.from(revenueMap.entries())
    .map(([date, cents]) => ({ date, cents }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top events by revenue
  const eventRevenue = new Map<string, { revenue: number; sold: number }>();
  for (const order of paidOrders ?? []) {
    const existing = eventRevenue.get(order.event_id) ?? { revenue: 0, sold: 0 };
    existing.revenue += order.total_cents;
    eventRevenue.set(order.event_id, existing);
  }

  const { data: ticketsByEvent } = await supabase
    .from("tickets")
    .select("event_id");

  for (const t of ticketsByEvent ?? []) {
    const existing = eventRevenue.get(t.event_id) ?? { revenue: 0, sold: 0 };
    existing.sold += 1;
    eventRevenue.set(t.event_id, existing);
  }

  const topEventIds = Array.from(eventRevenue.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topEventData } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr")
    .in("id", topEventIds);

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
    topEvents,
  };
}
