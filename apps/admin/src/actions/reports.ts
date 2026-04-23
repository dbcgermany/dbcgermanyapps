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
  await requireRole("manager");
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

// ---------------------------------------------------------------------------
// Finance — accountant-grade reporting with three-bucket channel taxonomy
// (Online / Door / Comped). Every finance action is admin+ gated. Shares a
// single fetch+aggregate pipeline so the summary and three CSVs stay
// consistent with each other and with the dashboard channel split.
// ---------------------------------------------------------------------------

export type FinanceChannel = "online" | "door" | "comped";

export interface FinanceFilter {
  /** Inclusive ISO datetime. */
  from?: string;
  /** Exclusive ISO datetime. */
  to?: string;
  /** Narrow to a single channel bucket. */
  channel?: FinanceChannel;
  /** Narrow to a single event. */
  eventId?: string;
}

export interface FinanceChannelSummary {
  orders: number;
  tickets: number;
  /** Gross = sum of total_cents for status='paid'. Comped is always 0. */
  grossCents: number;
  /** Refunded = sum of total_cents for status='refunded'. Comped is always 0. */
  refundCents: number;
  /** Net = gross - refunds. */
  netCents: number;
}

export interface FinancePaymentMethodRow {
  /** Display key: "card" | "sepa" | "paypal" | "cash" | "door_card" | "door_cash" | "comped". */
  method: string;
  channel: FinanceChannel;
  orders: number;
  tickets: number;
  grossCents: number;
  refundCents: number;
  netCents: number;
}

export interface FinanceEventRow {
  eventId: string;
  eventTitle: string;
  eventSlug: string | null;
  startsAt: string;
  online: FinanceChannelSummary;
  door: FinanceChannelSummary;
  comped: FinanceChannelSummary;
  totalGrossCents: number;
  totalRefundCents: number;
  totalNetCents: number;
}

export interface FinanceSummary {
  online: FinanceChannelSummary;
  door: FinanceChannelSummary;
  comped: FinanceChannelSummary;
  paymentMethods: FinancePaymentMethodRow[];
  perEvent: FinanceEventRow[];
  /** Paid-order value for events whose ends_at is still in the future. */
  deferredRevenueCents: number;
  /** Heuristic: 1.5% of online gross + €0.25 per online order. Real
   *  number still comes from Stripe's payout reports. */
  stripeFeeEstimateCents: number;
  currency: string;
}

type FinanceOrderRow = {
  id: string;
  event_id: string;
  status: "paid" | "refunded" | "comped";
  acquisition_type: "purchased" | "door_sale" | "invited" | "assigned";
  payment_method: "card" | "sepa" | "paypal" | "cash" | null;
  total_cents: number;
  subtotal_cents: number;
  discount_cents: number;
  currency: string;
  recipient_name: string;
  recipient_email: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  contact: { country: string | null } | { country: string | null }[] | null;
  tickets: { id: string }[] | null;
};

function channelOf(o: FinanceOrderRow): FinanceChannel {
  if (o.status === "comped") return "comped";
  if (o.acquisition_type === "door_sale") return "door";
  return "online";
}

function methodKey(o: FinanceOrderRow): string {
  const ch = channelOf(o);
  if (ch === "comped") return "comped";
  if (ch === "door") {
    return o.payment_method === "card" ? "door_card" : "door_cash";
  }
  return o.payment_method ?? "card";
}

function emptyChannel(): FinanceChannelSummary {
  return { orders: 0, tickets: 0, grossCents: 0, refundCents: 0, netCents: 0 };
}

function accumulate(bucket: FinanceChannelSummary, o: FinanceOrderRow) {
  bucket.orders += 1;
  bucket.tickets += o.tickets?.length ?? 0;
  if (o.status === "paid") bucket.grossCents += o.total_cents;
  else if (o.status === "refunded") bucket.refundCents += o.total_cents;
  bucket.netCents = bucket.grossCents - bucket.refundCents;
}

function contactCountry(contact: FinanceOrderRow["contact"]): string {
  if (!contact) return "";
  if (Array.isArray(contact)) return contact[0]?.country ?? "";
  return contact.country ?? "";
}

async function fetchFinanceOrders(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  filter: FinanceFilter
): Promise<FinanceOrderRow[]> {
  let query = supabase
    .from("orders")
    .select(
      "id, event_id, status, acquisition_type, payment_method, total_cents, subtotal_cents, discount_cents, currency, recipient_name, recipient_email, stripe_checkout_session_id, stripe_payment_intent_id, created_at, updated_at, contact:contacts(country), tickets(id)"
    )
    .in("status", ["paid", "refunded", "comped"]);

  if (filter.from) query = query.gte("created_at", filter.from);
  if (filter.to) query = query.lt("created_at", filter.to);
  if (filter.eventId) query = query.eq("event_id", filter.eventId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as FinanceOrderRow[];
  if (!filter.channel) return rows;
  return rows.filter((o) => channelOf(o) === filter.channel);
}

export async function getFinanceSummary(
  filter: FinanceFilter = {}
): Promise<FinanceSummary> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const orders = await fetchFinanceOrders(supabase, filter);

  const online = emptyChannel();
  const door = emptyChannel();
  const comped = emptyChannel();

  const methodMap = new Map<string, FinancePaymentMethodRow>();
  const eventMap = new Map<
    string,
    { online: FinanceChannelSummary; door: FinanceChannelSummary; comped: FinanceChannelSummary }
  >();

  let currency = "EUR";
  let onlineOrderCount = 0;

  for (const o of orders) {
    currency = o.currency || currency;
    const ch = channelOf(o);
    const bucket = ch === "online" ? online : ch === "door" ? door : comped;
    accumulate(bucket, o);
    if (ch === "online") onlineOrderCount += 1;

    const mKey = methodKey(o);
    const mRow = methodMap.get(mKey) ?? {
      method: mKey,
      channel: ch,
      orders: 0,
      tickets: 0,
      grossCents: 0,
      refundCents: 0,
      netCents: 0,
    };
    mRow.orders += 1;
    mRow.tickets += o.tickets?.length ?? 0;
    if (o.status === "paid") mRow.grossCents += o.total_cents;
    else if (o.status === "refunded") mRow.refundCents += o.total_cents;
    mRow.netCents = mRow.grossCents - mRow.refundCents;
    methodMap.set(mKey, mRow);

    const evBuckets = eventMap.get(o.event_id) ?? {
      online: emptyChannel(),
      door: emptyChannel(),
      comped: emptyChannel(),
    };
    accumulate(
      ch === "online" ? evBuckets.online : ch === "door" ? evBuckets.door : evBuckets.comped,
      o
    );
    eventMap.set(o.event_id, evBuckets);
  }

  const eventIds = Array.from(eventMap.keys());
  const [eventsRes, deferredRes] = await Promise.all([
    eventIds.length > 0
      ? supabase
          .from("events")
          .select("id, slug, title_en, starts_at")
          .in("id", eventIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; slug: string | null; title_en: string; starts_at: string }>,
        }),
    supabase
      .from("orders")
      .select("total_cents, event:events!inner(ends_at)")
      .eq("status", "paid")
      .gt("event.ends_at", new Date().toISOString()),
  ]);

  const eventLookup = new Map(
    (eventsRes.data ?? []).map((e) => [
      e.id,
      { slug: e.slug, title: e.title_en, startsAt: e.starts_at },
    ])
  );

  const perEvent: FinanceEventRow[] = eventIds
    .map((id) => {
      const buckets = eventMap.get(id)!;
      const meta = eventLookup.get(id);
      const totalGross =
        buckets.online.grossCents + buckets.door.grossCents;
      const totalRefund =
        buckets.online.refundCents + buckets.door.refundCents;
      return {
        eventId: id,
        eventTitle: meta?.title ?? "—",
        eventSlug: meta?.slug ?? null,
        startsAt: meta?.startsAt ?? "",
        online: buckets.online,
        door: buckets.door,
        comped: buckets.comped,
        totalGrossCents: totalGross,
        totalRefundCents: totalRefund,
        totalNetCents: totalGross - totalRefund,
      };
    })
    .sort((a, b) => b.totalGrossCents - a.totalGrossCents);

  const deferredRevenueCents = (deferredRes.data ?? []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum, r: any) => sum + (r.total_cents ?? 0),
    0
  );

  // 1.5% + €0.25/txn — rough pass-through rate for SEPA/card in EU.
  const stripeFeeEstimateCents = Math.round(
    online.grossCents * 0.015 + onlineOrderCount * 25
  );

  return {
    online,
    door,
    comped,
    paymentMethods: Array.from(methodMap.values()).sort(
      (a, b) => b.grossCents - a.grossCents
    ),
    perEvent,
    deferredRevenueCents,
    stripeFeeEstimateCents,
    currency,
  };
}

export interface FinanceOrderCsvRow {
  order_id: string;
  created_at: string;
  event_slug: string;
  event_title_en: string;
  channel: FinanceChannel;
  acquisition_type: string;
  status: string;
  payment_method: string;
  buyer_name: string;
  buyer_email: string;
  buyer_country: string;
  ticket_count: number;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  refunded_at: string;
  refunded_cents: number;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string;
}

export async function getFinanceOrdersCsv(
  filter: FinanceFilter = {}
): Promise<FinanceOrderCsvRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const orders = await fetchFinanceOrders(supabase, filter);
  const eventIds = [...new Set(orders.map((o) => o.event_id))];
  const { data: events } = eventIds.length
    ? await supabase
        .from("events")
        .select("id, slug, title_en")
        .in("id", eventIds)
    : { data: [] as Array<{ id: string; slug: string | null; title_en: string }> };
  const eventLookup = new Map((events ?? []).map((e) => [e.id, e]));

  return orders
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((o) => {
      const ev = eventLookup.get(o.event_id);
      const refunded = o.status === "refunded";
      return {
        order_id: o.id,
        created_at: o.created_at,
        event_slug: ev?.slug ?? "",
        event_title_en: ev?.title_en ?? "",
        channel: channelOf(o),
        acquisition_type: o.acquisition_type,
        status: o.status,
        payment_method: o.payment_method ?? "",
        buyer_name: o.recipient_name,
        buyer_email: o.recipient_email,
        buyer_country: contactCountry(o.contact),
        ticket_count: o.tickets?.length ?? 0,
        subtotal_cents: o.subtotal_cents,
        discount_cents: o.discount_cents,
        total_cents: o.total_cents,
        currency: o.currency,
        refunded_at: refunded ? o.updated_at : "",
        refunded_cents: refunded ? o.total_cents : 0,
        stripe_checkout_session_id: o.stripe_checkout_session_id ?? "",
        stripe_payment_intent_id: o.stripe_payment_intent_id ?? "",
      };
    });
}

export interface FinanceSummaryCsvRow {
  date: string;
  channel: FinanceChannel;
  payment_method: string;
  event_slug: string;
  orders: number;
  tickets: number;
  gross_cents: number;
  refund_cents: number;
  net_cents: number;
  currency: string;
}

export async function getFinanceSummaryCsv(
  filter: FinanceFilter = {}
): Promise<FinanceSummaryCsvRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const orders = await fetchFinanceOrders(supabase, filter);
  const eventIds = [...new Set(orders.map((o) => o.event_id))];
  const { data: events } = eventIds.length
    ? await supabase.from("events").select("id, slug").in("id", eventIds)
    : { data: [] as Array<{ id: string; slug: string | null }> };
  const slugLookup = new Map((events ?? []).map((e) => [e.id, e.slug ?? ""]));

  // Pivot: (date, channel, method, event_slug) → aggregate.
  const pivot = new Map<string, FinanceSummaryCsvRow>();
  for (const o of orders) {
    const date = o.created_at.slice(0, 10);
    const ch = channelOf(o);
    const method = methodKey(o);
    const slug = slugLookup.get(o.event_id) ?? "";
    const key = `${date}|${ch}|${method}|${slug}`;
    const row = pivot.get(key) ?? {
      date,
      channel: ch,
      payment_method: method,
      event_slug: slug,
      orders: 0,
      tickets: 0,
      gross_cents: 0,
      refund_cents: 0,
      net_cents: 0,
      currency: o.currency,
    };
    row.orders += 1;
    row.tickets += o.tickets?.length ?? 0;
    if (o.status === "paid") row.gross_cents += o.total_cents;
    else if (o.status === "refunded") row.refund_cents += o.total_cents;
    row.net_cents = row.gross_cents - row.refund_cents;
    pivot.set(key, row);
  }

  return Array.from(pivot.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.channel !== b.channel) return a.channel < b.channel ? -1 : 1;
    return a.payment_method < b.payment_method ? -1 : 1;
  });
}

export interface FinanceRefundCsvRow {
  order_id: string;
  refunded_at: string;
  original_total_cents: number;
  refunded_cents: number;
  channel: FinanceChannel;
  payment_method: string;
  buyer_email: string;
  event_slug: string;
}

export async function getFinanceRefundsCsv(
  filter: FinanceFilter = {}
): Promise<FinanceRefundCsvRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const orders = (await fetchFinanceOrders(supabase, filter)).filter(
    (o) => o.status === "refunded"
  );
  const eventIds = [...new Set(orders.map((o) => o.event_id))];
  const { data: events } = eventIds.length
    ? await supabase.from("events").select("id, slug").in("id", eventIds)
    : { data: [] as Array<{ id: string; slug: string | null }> };
  const slugLookup = new Map((events ?? []).map((e) => [e.id, e.slug ?? ""]));

  return orders
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .map((o) => ({
      order_id: o.id,
      refunded_at: o.updated_at,
      original_total_cents: o.total_cents,
      refunded_cents: o.total_cents,
      channel: channelOf(o),
      payment_method: methodKey(o),
      buyer_email: o.recipient_email,
      event_slug: slugLookup.get(o.event_id) ?? "",
    }));
}
