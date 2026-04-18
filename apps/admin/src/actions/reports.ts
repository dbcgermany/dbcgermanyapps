"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

export interface OrdersReportRow {
  id: string;
  createdAt: string;
  eventTitle: string;
  status: string;
  acquisitionType: string;
  paymentMethod: string | null;
  recipientName: string;
  recipientEmail: string;
  totalCents: number;
  discountCents: number;
  currency: string;
}

export interface AttendeesReportRow {
  ticketId: string;
  ticketToken: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  tierName: string;
  acquisitionType: string;
  checkedInAt: string | null;
  createdAt: string;
}

export interface RevenueByEventRow {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  ordersPaid: number;
  ticketsSold: number;
  revenueCents: number;
  currency: string;
}

function localizedTitle(
  event:
    | { title_en: string; title_de: string; title_fr: string }
    | null
    | undefined,
  locale: string
): string {
  if (!event) return "\u2014";
  const key = `title_${locale}` as keyof typeof event;
  return (event[key] as string) || event.title_en;
}

function localizedTierName(
  tier:
    | { name_en: string; name_de: string; name_fr: string }
    | null
    | undefined,
  locale: string
): string {
  if (!tier) return "\u2014";
  const key = `name_${locale}` as keyof typeof tier;
  return (tier[key] as string) || tier.name_en;
}

export async function getOrdersReport(opts: {
  locale: string;
  eventId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<OrdersReportRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  let query = supabase
    .from("orders")
    .select(
      "id, event_id, total_cents, discount_cents, currency, status, acquisition_type, payment_method, recipient_name, recipient_email, created_at"
    )
    .order("created_at", { ascending: false });

  if (opts.eventId) query = query.eq("event_id", opts.eventId);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.fromDate) query = query.gte("created_at", opts.fromDate);
  if (opts.toDate) query = query.lte("created_at", opts.toDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const eventIds = [...new Set((data ?? []).map((o) => o.event_id))];
  let eventMap = new Map<
    string,
    { id: string; title_en: string; title_de: string; title_fr: string }
  >();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, title_en, title_de, title_fr")
      .in("id", eventIds);
    eventMap = new Map((events ?? []).map((e) => [e.id, e]));
  }

  return (data ?? []).map((o) => ({
    id: o.id,
    createdAt: o.created_at,
    eventTitle: localizedTitle(eventMap.get(o.event_id), opts.locale),
    status: o.status,
    acquisitionType: o.acquisition_type,
    paymentMethod: o.payment_method,
    recipientName: o.recipient_name,
    recipientEmail: o.recipient_email,
    totalCents: o.total_cents,
    discountCents: o.discount_cents,
    currency: o.currency,
  }));
}

export async function getAttendeesReport(opts: {
  locale: string;
  eventId?: string;
  checkedIn?: "yes" | "no" | "";
  fromDate?: string;
  toDate?: string;
}): Promise<AttendeesReportRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  let query = supabase
    .from("tickets")
    .select(
      "id, event_id, ticket_token, attendee_name, attendee_email, tier_id, order_id, checked_in_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (opts.eventId) query = query.eq("event_id", opts.eventId);
  if (opts.checkedIn === "yes") query = query.not("checked_in_at", "is", null);
  if (opts.checkedIn === "no") query = query.is("checked_in_at", null);
  if (opts.fromDate) query = query.gte("created_at", opts.fromDate);
  if (opts.toDate) query = query.lte("created_at", opts.toDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const tierIds = [...new Set((data ?? []).map((t) => t.tier_id))];
  const orderIds = [...new Set((data ?? []).map((t) => t.order_id))];
  const eventIds = [...new Set((data ?? []).map((t) => t.event_id))];

  const [tiersRes, ordersRes, eventsRes] = await Promise.all([
    tierIds.length > 0
      ? supabase
          .from("ticket_tiers")
          .select("id, name_en, name_de, name_fr")
          .in("id", tierIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name_en: string; name_de: string; name_fr: string }> }),
    orderIds.length > 0
      ? supabase.from("orders").select("id, acquisition_type").in("id", orderIds)
      : Promise.resolve({ data: [] as Array<{ id: string; acquisition_type: string }> }),
    eventIds.length > 0
      ? supabase
          .from("events")
          .select("id, title_en, title_de, title_fr")
          .in("id", eventIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title_en: string; title_de: string; title_fr: string }> }),
  ]);

  const tierMap = new Map((tiersRes.data ?? []).map((t) => [t.id, t]));
  const orderMap = new Map((ordersRes.data ?? []).map((o) => [o.id, o]));
  const eventMap = new Map((eventsRes.data ?? []).map((e) => [e.id, e]));

  return (data ?? []).map((t) => ({
    ticketId: t.id,
    ticketToken: t.ticket_token,
    attendeeName: t.attendee_name,
    attendeeEmail: t.attendee_email,
    eventTitle: localizedTitle(eventMap.get(t.event_id), opts.locale),
    tierName: localizedTierName(tierMap.get(t.tier_id), opts.locale),
    acquisitionType: orderMap.get(t.order_id)?.acquisition_type ?? "",
    checkedInAt: t.checked_in_at,
    createdAt: t.created_at,
  }));
}

export async function getRevenueByEventReport(opts: {
  locale: string;
  fromDate?: string;
  toDate?: string;
}): Promise<RevenueByEventRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  // Paid orders only — matches dashboard.ts revenue logic.
  let ordersQuery = supabase
    .from("orders")
    .select("event_id, total_cents, currency, created_at")
    .eq("status", "paid");

  if (opts.fromDate) ordersQuery = ordersQuery.gte("created_at", opts.fromDate);
  if (opts.toDate) ordersQuery = ordersQuery.lte("created_at", opts.toDate);

  const { data: paidOrders, error: ordersError } = await ordersQuery;
  if (ordersError) throw new Error(ordersError.message);

  // Tickets sold per event — count rows in tickets table within the same date window.
  let ticketsQuery = supabase.from("tickets").select("event_id, created_at");
  if (opts.fromDate) ticketsQuery = ticketsQuery.gte("created_at", opts.fromDate);
  if (opts.toDate) ticketsQuery = ticketsQuery.lte("created_at", opts.toDate);

  const { data: tickets, error: ticketsError } = await ticketsQuery;
  if (ticketsError) throw new Error(ticketsError.message);

  const stats = new Map<
    string,
    { ordersPaid: number; ticketsSold: number; revenueCents: number; currency: string }
  >();

  for (const o of paidOrders ?? []) {
    const existing = stats.get(o.event_id) ?? {
      ordersPaid: 0,
      ticketsSold: 0,
      revenueCents: 0,
      currency: o.currency,
    };
    existing.ordersPaid += 1;
    existing.revenueCents += o.total_cents;
    existing.currency = o.currency;
    stats.set(o.event_id, existing);
  }

  for (const t of tickets ?? []) {
    const existing = stats.get(t.event_id) ?? {
      ordersPaid: 0,
      ticketsSold: 0,
      revenueCents: 0,
      currency: "EUR",
    };
    existing.ticketsSold += 1;
    stats.set(t.event_id, existing);
  }

  const eventIds = Array.from(stats.keys());
  if (eventIds.length === 0) return [];

  const { data: events } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at")
    .in("id", eventIds);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));

  return eventIds
    .map((id) => {
      const event = eventMap.get(id);
      const s = stats.get(id)!;
      return {
        eventId: id,
        eventTitle: localizedTitle(event, opts.locale),
        startsAt: event?.starts_at ?? "",
        ordersPaid: s.ordersPaid,
        ticketsSold: s.ticketsSold,
        revenueCents: s.revenueCents,
        currency: s.currency,
      };
    })
    .filter((r) => r.eventTitle !== "\u2014")
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

// ---------------------------------------------------------------------------
// Coupon performance
// ---------------------------------------------------------------------------

export interface CouponPerformanceRow {
  code: string;
  uses: number;
  totalDiscountCents: number;
  totalRevenueCents: number;
}

export async function getCouponPerformanceReport(eventId?: string) {
  await requireRole("admin");
  const supabase = await createServerClient();

  let query = supabase
    .from("orders")
    .select("total_cents, discount_cents, coupon:coupons(code)")
    .not("coupon_id", "is", null)
    .in("status", ["paid", "comped"]);

  if (eventId) query = query.eq("event_id", eventId);

  const { data } = await query;

  const map = new Map<string, CouponPerformanceRow>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of (data ?? []) as any[]) {
    const code =
      Array.isArray(o.coupon) ? o.coupon[0]?.code : o.coupon?.code;
    if (!code) continue;
    const existing = map.get(code) ?? {
      code,
      uses: 0,
      totalDiscountCents: 0,
      totalRevenueCents: 0,
    };
    existing.uses++;
    existing.totalDiscountCents += o.discount_cents ?? 0;
    existing.totalRevenueCents += o.total_cents ?? 0;
    map.set(code, existing);
  }

  return [...map.values()].sort((a, b) => b.uses - a.uses);
}

// ---------------------------------------------------------------------------
// Event financial summary (P&L)
// ---------------------------------------------------------------------------

export interface EventFinancialSummary {
  eventId: string;
  eventTitle: string;
  revenueCents: number;
  expensesCents: number;
  profitCents: number;
  taxEstimateCents: number;
}

export async function getEventFinancialSummary(
  eventId: string,
  taxRatePct: number = 19
): Promise<EventFinancialSummary> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const [eventRes, revenueRes, expensesRes] = await Promise.all([
    supabase.from("events").select("title_en").eq("id", eventId).single(),
    supabase
      .from("orders")
      .select("total_cents")
      .eq("event_id", eventId)
      .in("status", ["paid", "comped"]),
    supabase
      .from("event_expenses")
      .select("amount_cents")
      .eq("event_id", eventId),
  ]);

  const revenueCents = (revenueRes.data ?? []).reduce(
    (s, o) => s + (o.total_cents ?? 0),
    0
  );
  const expensesCents = (expensesRes.data ?? []).reduce(
    (s, e) => s + (e.amount_cents ?? 0),
    0
  );
  const taxEstimateCents = Math.round(
    revenueCents - revenueCents / (1 + taxRatePct / 100)
  );

  return {
    eventId,
    eventTitle: eventRes.data?.title_en ?? "Event",
    revenueCents,
    expensesCents,
    profitCents: revenueCents - expensesCents,
    taxEstimateCents,
  };
}

export async function getReportsEvents() {
  await requireRole("admin");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr")
    .order("starts_at", { ascending: false });

  return data ?? [];
}
