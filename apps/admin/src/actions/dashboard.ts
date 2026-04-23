"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

/**
 * Per-channel aggregate. Three channels get aggregated today:
 *   - online: self-serve Stripe (acquisition_type='purchased')
 *   - door:   operator-assisted paid sales (acquisition_type='door_sale')
 *   - comped: zero-revenue invitations/assignments (status='comped')
 *
 * `revenueCents` / `refundCents` are always 0 for comped (no money moves).
 */
export interface ChannelStats {
  orders: number;
  tickets: number;
  revenueCents: number;
  refundCents: number;
}

export interface PeriodStats {
  revenueCents: number;       // gross ticket revenue (paid + comped)
  netRevenueCents: number;    // gross − refunds
  refundCents: number;        // sum of refunded orders
  paidOrderCount: number;
  ticketsSold: number;
  checkIns: number;
  aovCents: number;           // gross / paid order count
  arpaCents: number;          // gross / tickets sold
  // Abandoned-cart signal: orders where the buyer reached Stripe's hosted
  // checkout page (session id present) but never completed payment. A real
  // intent-to-buy signal distinct from "Tickets sold".
  abandonedCheckouts: number;
  abandonedRevenueCents: number;
  // Per-channel split — same window as the aggregates above.
  online: ChannelStats;
  door: ChannelStats;
  comped: ChannelStats;
}

export interface DashboardKpis {
  // Current-period headline
  totalRevenueCents: number;
  ticketsSold: number;
  activeEventCount: number;
  checkInRate: number;        // 0-100

  // Phase A additions
  current: PeriodStats;
  prior: PeriodStats;         // same duration window immediately before `from`
  velocity7dAvg: number;      // tickets/day rolling 7d for the current window
  refundRatePct: number;      // refunds / (paid + refunds) × 100

  // Charts
  revenueByDay: { date: string; cents: number }[];
  checkInsByDay: { date: string; count: number }[];

  // Top events
  topEvents: { id: string; title: string; revenue: number; sold: number }[];

  // Per-event sell-through for the top active events
  sellThrough: {
    eventId: string;
    eventTitle: string;
    sold: number;
    capacity: number;
    pct: number;
  }[];

  range: { from: string; to: string };
}

function isoDay(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function pctChange(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100;
  return ((current - prior) / prior) * 100;
}

type ChannelOrderRow = {
  status: string | null;
  total_cents: number | null;
  tickets: { id: string }[] | null;
};

function aggregateChannel(rows: ChannelOrderRow[]): ChannelStats {
  let orders = 0;
  let tickets = 0;
  let revenueCents = 0;
  let refundCents = 0;
  for (const o of rows) {
    orders += 1;
    tickets += o.tickets?.length ?? 0;
    if (o.status === "paid") revenueCents += o.total_cents ?? 0;
    else if (o.status === "refunded") refundCents += o.total_cents ?? 0;
    // `comped` contributes zero revenue + zero refund on purpose.
  }
  return { orders, tickets, revenueCents, refundCents };
}

/** Computes KPIs for a single [fromTs, toTs) window. */
async function computePeriodStats(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  fromTs: string,
  toTs: string
): Promise<PeriodStats> {
  const [
    paidRes,
    refundRes,
    ticketsRes,
    checkInsRes,
    abandonedRes,
    onlineRes,
    doorRes,
    compedRes,
  ] = await Promise.all([
      supabase
        .from("orders")
        .select("total_cents", { count: "exact" })
        .in("status", ["paid", "comped"])
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
      supabase
        .from("orders")
        .select("total_cents")
        .eq("status", "refunded")
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
      // Only count tickets whose parent order actually sold (paid or
      // comped). Without the inner-join filter, every reservation — even
      // ones the buyer abandoned on Stripe — gets counted.
      supabase
        .from("tickets")
        .select("id, orders!inner(status)", { count: "exact", head: true })
        .in("orders.status", ["paid", "comped"])
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .gte("checked_in_at", fromTs)
        .lt("checked_in_at", toTs)
        .not("checked_in_at", "is", null),
      // Abandoned-cart count + potential revenue. Definition: the buyer
      // made it as far as Stripe's hosted checkout page (so a session id
      // was stamped on the order) but never paid. Excludes orders that
      // failed before Stripe (those are checkout errors, tracked via
      // the Stripe error log, not this KPI).
      supabase
        .from("orders")
        .select("total_cents")
        .in("status", ["pending", "cancelled"])
        .not("stripe_checkout_session_id", "is", null)
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
      // Channel split — three queries, mutually exclusive so nothing is
      // double-counted. Embedded tickets(id) gives us the ticket count
      // per order without a second round-trip.
      supabase
        .from("orders")
        .select("status, total_cents, tickets(id)")
        .eq("acquisition_type", "purchased")
        .in("status", ["paid", "refunded"])
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
      supabase
        .from("orders")
        .select("status, total_cents, tickets(id)")
        .eq("acquisition_type", "door_sale")
        .in("status", ["paid", "refunded"])
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
      supabase
        .from("orders")
        .select("status, total_cents, tickets(id)")
        .eq("status", "comped")
        .gte("created_at", fromTs)
        .lt("created_at", toTs),
    ]);

  const revenueCents = (paidRes.data ?? []).reduce(
    (s, o) => s + (o.total_cents ?? 0),
    0
  );
  const refundCents = (refundRes.data ?? []).reduce(
    (s, o) => s + (o.total_cents ?? 0),
    0
  );
  const paidOrderCount = paidRes.count ?? 0;
  const ticketsSold = ticketsRes.count ?? 0;
  const abandonedRows = (abandonedRes.data ?? []) as Array<{
    total_cents: number | null;
  }>;
  const abandonedRevenueCents = abandonedRows.reduce(
    (s, o) => s + (o.total_cents ?? 0),
    0
  );

  const online = aggregateChannel((onlineRes.data ?? []) as ChannelOrderRow[]);
  const door = aggregateChannel((doorRes.data ?? []) as ChannelOrderRow[]);
  const comped = aggregateChannel((compedRes.data ?? []) as ChannelOrderRow[]);

  return {
    revenueCents,
    netRevenueCents: revenueCents - refundCents,
    refundCents,
    paidOrderCount,
    ticketsSold,
    checkIns: checkInsRes.count ?? 0,
    aovCents: paidOrderCount > 0 ? Math.round(revenueCents / paidOrderCount) : 0,
    arpaCents: ticketsSold > 0 ? Math.round(revenueCents / ticketsSold) : 0,
    abandonedCheckouts: abandonedRows.length,
    abandonedRevenueCents,
    online,
    door,
    comped,
  };
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

  // Prior-period window = same duration immediately before `fromTs`.
  const windowMs =
    new Date(`${to}T23:59:59.999Z`).getTime() -
    new Date(`${from}T00:00:00.000Z`).getTime();
  const priorToTs = new Date(
    new Date(fromTs).getTime() - 1
  ).toISOString();
  const priorFromTs = new Date(
    new Date(priorToTs).getTime() - windowMs
  ).toISOString();

  const [current, prior] = await Promise.all([
    computePeriodStats(supabase, fromTs, toTs),
    computePeriodStats(supabase, priorFromTs, priorToTs),
  ]);

  // Paid orders in window (for chart + top events)
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_cents, created_at, event_id")
    .in("status", ["paid", "comped"])
    .gte("created_at", fromTs)
    .lte("created_at", toTs);

  // Active events (published, ending in future)
  const { count: activeEventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .gte("ends_at", new Date().toISOString());

  const checkInRate = current.ticketsSold
    ? Math.round((current.checkIns / current.ticketsSold) * 100)
    : 0;

  // Revenue-by-day (zero-filled across window)
  const revenueMap = new Map<string, number>();
  for (const o of paidOrders ?? []) {
    const key = isoDay(o.created_at);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + (o.total_cents ?? 0));
  }

  // Check-ins-by-day
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

  // 7-day rolling velocity — average tickets/day over the last 7 days of the window
  const last7CheckIns = checkInsByDay.slice(-7);
  const last7Tickets = last7CheckIns.reduce((s, r) => s + r.count, 0);
  const velocity7dAvg = last7Tickets / Math.max(1, last7CheckIns.length);

  // Top events by revenue within window
  const eventRevenue = new Map<string, { revenue: number; sold: number }>();
  for (const o of paidOrders ?? []) {
    const existing = eventRevenue.get(o.event_id) ?? { revenue: 0, sold: 0 };
    existing.revenue += o.total_cents ?? 0;
    eventRevenue.set(o.event_id, existing);
  }
  // Same paid/comped filter as the dashboard ticketsSold KPI — otherwise
  // the Top-Events "sold" column includes tickets from abandoned carts.
  const { data: ticketsByEvent } = await supabase
    .from("tickets")
    .select("event_id, orders!inner(status)")
    .in("orders.status", ["paid", "comped"])
    .gte("created_at", fromTs)
    .lte("created_at", toTs);
  for (const t of (ticketsByEvent ?? []) as Array<{ event_id: string }>) {
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

  // Sell-through per active event (top 5 by capacity)
  const { data: activeEvents } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr")
    .eq("is_published", true)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  const sellThrough: DashboardKpis["sellThrough"] = [];
  if (activeEvents && activeEvents.length > 0) {
    const activeEventIds = activeEvents.map((e) => e.id);
    const { data: tierRows } = await supabase
      .from("ticket_tiers")
      .select("event_id, max_quantity, quantity_sold")
      .in("event_id", activeEventIds);

    const perEvent = new Map<
      string,
      { sold: number; capacity: number }
    >();
    for (const tier of tierRows ?? []) {
      const acc = perEvent.get(tier.event_id) ?? { sold: 0, capacity: 0 };
      acc.sold += tier.quantity_sold ?? 0;
      acc.capacity += tier.max_quantity ?? 0;
      perEvent.set(tier.event_id, acc);
    }

    for (const event of activeEvents) {
      const stats = perEvent.get(event.id) ?? { sold: 0, capacity: 0 };
      const title =
        (event[`title_${locale}` as keyof typeof event] as string) ||
        event.title_en;
      sellThrough.push({
        eventId: event.id,
        eventTitle: title,
        sold: stats.sold,
        capacity: stats.capacity,
        pct:
          stats.capacity > 0
            ? Math.round((stats.sold / stats.capacity) * 100)
            : 0,
      });
    }
  }

  // Refund rate = refunds / (paid + refunds)
  const refundDenom = current.revenueCents + current.refundCents;
  const refundRatePct =
    refundDenom > 0 ? (current.refundCents / refundDenom) * 100 : 0;

  return {
    totalRevenueCents: current.revenueCents,
    ticketsSold: current.ticketsSold,
    activeEventCount: activeEventCount ?? 0,
    checkInRate,
    current,
    prior,
    velocity7dAvg,
    refundRatePct,
    revenueByDay,
    checkInsByDay,
    topEvents,
    sellThrough,
    range: { from, to },
  };
}

/** Helper exported for UI: format cents as "€1,234.56" */
export async function formatCents(cents: number, locale: string): Promise<string> {
  return new Intl.NumberFormat(locale || "en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Helper exported for UI: percent-change vs prior period */
export async function deltaVsPrior(
  current: number,
  prior: number
): Promise<{ pct: number; direction: "up" | "down" | "flat" }> {
  const pct = pctChange(current, prior);
  const direction =
    Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
  return { pct, direction };
}
