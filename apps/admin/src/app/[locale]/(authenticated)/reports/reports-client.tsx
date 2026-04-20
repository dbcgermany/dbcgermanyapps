"use client";

import { Badge, formatMoney } from "@dbc/ui";
import { ORDER_STATUS_VALUES } from "@dbc/types";
import { useRouter } from "next/navigation";
import {
  BarChart,
  DonutChart,
  ChartCard,
  ChartLegend,
  CHART_COLORS,
} from "@/components/charts";
import type {
  OrdersReportRow,
  AttendeesReportRow,
  RevenueByEventRow,
  CouponPerformanceRow,
  EventFinancialSummary,
} from "@/actions/reports";

const STATUS_OPTIONS = ["", ...ORDER_STATUS_VALUES] as const;

interface FilterState {
  event: string;
  status: string;
  checkedIn: string;
  from: string;
  to: string;
}

function escapeCsvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(iso: string, locale: string): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PREVIEW_LIMIT = 50;

export function ReportsClient({
  locale,
  orders,
  attendees,
  revenueByEvent,
  coupons,
  financial,
  events,
  currentEventFilter,
  currentStatusFilter,
  currentCheckedInFilter,
  currentFromFilter,
  currentToFilter,
}: {
  locale: string;
  orders: OrdersReportRow[];
  attendees: AttendeesReportRow[];
  revenueByEvent: RevenueByEventRow[];
  coupons: CouponPerformanceRow[];
  financial: EventFinancialSummary | null;
  events: { id: string; title: string }[];
  currentEventFilter: string;
  currentStatusFilter: string;
  currentCheckedInFilter: string;
  currentFromFilter: string;
  currentToFilter: string;
}) {
  const router = useRouter();

  function updateFilters(next: Partial<FilterState>) {
    const current: FilterState = {
      event: currentEventFilter,
      status: currentStatusFilter,
      checkedIn: currentCheckedInFilter,
      from: currentFromFilter,
      to: currentToFilter,
    };
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.event) params.set("event", merged.event);
    if (merged.status) params.set("status", merged.status);
    if (merged.checkedIn) params.set("checked_in", merged.checkedIn);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function clearFilters() {
    router.push("?");
  }

  const today = new Date().toISOString().slice(0, 10);

  const t = {
    en: {
      filters: "Filters",
      allEvents: "All events",
      allStatus: "All statuses",
      from: "From",
      to: "To",
      checkedInAny: "Any check-in",
      checkedInYes: "Checked in",
      checkedInNo: "Not checked in",
      clear: "Clear filters",
      ordersSection: "Orders",
      attendeesSection: "Attendees",
      revenueSection: "Revenue by event",
      couponsSection: "Coupon performance",
      financialSection: "Event P&L (select an event to view)",
      couponCode: "Code",
      uses: "Uses",
      discountGiven: "Discount given",
      revenueDriven: "Revenue driven",
      finRevenue: "Revenue",
      finExpenses: "Expenses",
      finProfit: "Net profit",
      finTax: "Tax estimate (19%)",
      exportCsv: "Export CSV",
      showing: "Showing",
      of: "of",
      rows: "rows",
      noRows: "No rows match your filters.",
      event: "Event",
      status: "Status",
      customer: "Customer",
      total: "Total",
      date: "Date",
      attendee: "Attendee",
      tier: "Tier",
      acquisition: "Acquisition",
      checkIn: "Check-in",
      notScanned: "Not scanned",
      ordersPaid: "Paid orders",
      ticketsSold: "Tickets sold",
      revenue: "Revenue",
      starts: "Starts",
      pending: "Pending",
      paid: "Paid",
      comped: "Complimentary",
      refunded: "Refunded",
      cancelled: "Cancelled",
      purchased: "Purchased",
      invited: "Invited",
      assigned: "Assigned",
      door_sale: "Door sale",
    },
    de: {
      filters: "Filter",
      allEvents: "Alle Veranstaltungen",
      allStatus: "Alle Status",
      from: "Von",
      to: "Bis",
      checkedInAny: "Beliebiger Check-in",
      checkedInYes: "Eingecheckt",
      checkedInNo: "Nicht eingecheckt",
      clear: "Filter zur\u00FCcksetzen",
      ordersSection: "Bestellungen",
      attendeesSection: "Teilnehmer",
      revenueSection: "Einnahmen pro Veranstaltung",
      couponsSection: "Gutschein-Performance",
      financialSection: "Veranstaltungs-GuV (Veranstaltung ausw\u00E4hlen)",
      couponCode: "Code",
      uses: "Verwendungen",
      discountGiven: "Rabatt gew\u00E4hrt",
      revenueDriven: "Erzielte Einnahmen",
      finRevenue: "Einnahmen",
      finExpenses: "Ausgaben",
      finProfit: "Nettogewinn",
      finTax: "Steuer (19%)",
      exportCsv: "CSV exportieren",
      showing: "Zeige",
      of: "von",
      rows: "Zeilen",
      noRows: "Keine Zeilen gefunden.",
      event: "Veranstaltung",
      status: "Status",
      customer: "Kunde",
      total: "Gesamt",
      date: "Datum",
      attendee: "Teilnehmer",
      tier: "Tarif",
      acquisition: "Erwerb",
      checkIn: "Check-in",
      notScanned: "Nicht gescannt",
      ordersPaid: "Bezahlte Bestellungen",
      ticketsSold: "Verkaufte Tickets",
      revenue: "Einnahmen",
      starts: "Beginnt",
      pending: "Ausstehend",
      paid: "Bezahlt",
      comped: "Kostenlos",
      refunded: "Erstattet",
      cancelled: "Storniert",
      purchased: "Gekauft",
      invited: "Eingeladen",
      assigned: "Zugewiesen",
      door_sale: "Abendkasse",
    },
    fr: {
      filters: "Filtres",
      allEvents: "Tous les \u00E9v\u00E9nements",
      allStatus: "Tous les statuts",
      from: "Du",
      to: "Au",
      checkedInAny: "Tous (enregistr\u00E9s ou non)",
      checkedInYes: "Enregistr\u00E9s",
      checkedInNo: "Non enregistr\u00E9s",
      clear: "R\u00E9initialiser les filtres",
      ordersSection: "Commandes",
      attendeesSection: "Participants",
      revenueSection: "Revenus par \u00E9v\u00E9nement",
      couponsSection: "Performance des coupons",
      financialSection: "R\u00E9sultat de l\u2019\u00E9v\u00E9nement (s\u00E9lectionner)",
      couponCode: "Code",
      uses: "Utilisations",
      discountGiven: "R\u00E9duction accord\u00E9e",
      revenueDriven: "Revenus g\u00E9n\u00E9r\u00E9s",
      finRevenue: "Revenus",
      finExpenses: "D\u00E9penses",
      finProfit: "B\u00E9n\u00E9fice net",
      finTax: "TVA (19%)",
      exportCsv: "Exporter CSV",
      showing: "Affichage",
      of: "sur",
      rows: "lignes",
      noRows: "Aucune ligne ne correspond aux filtres.",
      event: "\u00C9v\u00E9nement",
      status: "Statut",
      customer: "Client",
      total: "Total",
      date: "Date",
      attendee: "Participant",
      tier: "Tarif",
      acquisition: "Acquisition",
      checkIn: "Enregistrement",
      notScanned: "Non scann\u00E9",
      ordersPaid: "Commandes pay\u00E9es",
      ticketsSold: "Billets vendus",
      revenue: "Revenus",
      starts: "D\u00E9but",
      pending: "En attente",
      paid: "Pay\u00E9",
      comped: "Gratuit",
      refunded: "Rembours\u00E9",
      cancelled: "Annul\u00E9",
      purchased: "Achet\u00E9",
      invited: "Invit\u00E9",
      assigned: "Attribu\u00E9",
      door_sale: "Sur place",
    },
  }[locale] ?? {
    filters: "Filters", allEvents: "All events", allStatus: "All statuses",
    from: "From", to: "To", checkedInAny: "Any", checkedInYes: "Checked in",
    checkedInNo: "Not checked in", clear: "Clear", ordersSection: "Orders",
    attendeesSection: "Attendees", revenueSection: "Revenue by event",
    couponsSection: "Coupon performance",
    financialSection: "Event P&L",
    couponCode: "Code", uses: "Uses",
    discountGiven: "Discount given", revenueDriven: "Revenue driven",
    finRevenue: "Revenue", finExpenses: "Expenses",
    finProfit: "Net profit", finTax: "Tax (19%)",
    exportCsv: "Export CSV", showing: "Showing", of: "of", rows: "rows",
    noRows: "No rows", event: "Event", status: "Status", customer: "Customer",
    total: "Total", date: "Date", attendee: "Attendee", tier: "Tier",
    acquisition: "Acquisition", checkIn: "Check-in", notScanned: "Not scanned",
    ordersPaid: "Paid orders", ticketsSold: "Tickets sold", revenue: "Revenue",
    starts: "Starts", pending: "Pending", paid: "Paid", comped: "Comped",
    refunded: "Refunded", cancelled: "Cancelled", purchased: "Purchased",
    invited: "Invited", assigned: "Assigned", door_sale: "Door sale",
  };

  function exportOrders() {
    downloadCsv(
      `orders-${today}.csv`,
      [
        "order_id",
        "created_at",
        "event",
        "status",
        "acquisition",
        "payment_method",
        "recipient_name",
        "recipient_email",
        "total_cents",
        "discount_cents",
        "currency",
      ],
      orders.map((o) => [
        o.id,
        o.createdAt,
        o.eventTitle,
        o.status,
        o.acquisitionType,
        o.paymentMethod ?? "",
        o.recipientName,
        o.recipientEmail,
        o.totalCents,
        o.discountCents,
        o.currency,
      ])
    );
  }

  function exportAttendees() {
    downloadCsv(
      `attendees-${today}.csv`,
      [
        "ticket_id",
        "ticket_token",
        "attendee_name",
        "attendee_email",
        "event",
        "tier",
        "acquisition",
        "checked_in_at",
        "created_at",
      ],
      attendees.map((a) => [
        a.ticketId,
        a.ticketToken,
        a.attendeeName,
        a.attendeeEmail,
        a.eventTitle,
        a.tierName,
        a.acquisitionType,
        a.checkedInAt ?? "",
        a.createdAt,
      ])
    );
  }

  function exportRevenue() {
    downloadCsv(
      `revenue-by-event-${today}.csv`,
      [
        "event_id",
        "event",
        "starts_at",
        "orders_paid",
        "tickets_sold",
        "revenue_cents",
        "currency",
      ],
      revenueByEvent.map((r) => [
        r.eventId,
        r.eventTitle,
        r.startsAt,
        r.ordersPaid,
        r.ticketsSold,
        r.revenueCents,
        r.currency,
      ])
    );
  }

  return (
    <div className="mt-6 space-y-10">
      {/* Shared filter bar */}
      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.filters}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentEventFilter}
            onChange={(e) => updateFilters({ event: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.allEvents}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          <select
            value={currentStatusFilter}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s === "" ? t.allStatus : t[s as keyof typeof t]}
              </option>
            ))}
          </select>

          <select
            value={currentCheckedInFilter}
            onChange={(e) => updateFilters({ checkedIn: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.checkedInAny}</option>
            <option value="yes">{t.checkedInYes}</option>
            <option value="no">{t.checkedInNo}</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t.from}
            <input
              type="date"
              value={currentFromFilter}
              onChange={(e) => updateFilters({ from: e.target.value })}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t.to}
            <input
              type="date"
              value={currentToFilter}
              onChange={(e) => updateFilters({ to: e.target.value })}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            onClick={clearFilters}
            className="ml-auto rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t.clear}
          </button>
        </div>
      </div>

      {/* Charts overview — visual summary above the tables */}
      {(() => {
        // Orders by status donut data
        const statusCounts = new Map<string, number>();
        for (const o of orders) {
          statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
        }
        const statusData = [...statusCounts.entries()].map(([name, value], i) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }));

        // Revenue by event bar data (top 10 by revenue)
        const revenueBarData = revenueByEvent
          .slice(0, 10)
          .map((r) => ({
            event:
              r.eventTitle.length > 22
                ? r.eventTitle.slice(0, 22) + "…"
                : r.eventTitle,
            revenue: r.revenueCents / 100,
          }));

        if (orders.length === 0 && revenueByEvent.length === 0) return null;

        return (
          <div className="grid gap-4 lg:grid-cols-2">
            {statusData.length > 0 && (
              <div>
                <ChartCard title={`${t.ordersSection} — status`} height={260}>
                  <DonutChart
                    data={statusData}
                    centerLabel={t.ordersSection}
                    centerValue={orders.length.toLocaleString(locale)}
                  />
                </ChartCard>
                <ChartLegend
                  items={statusData.map((d) => ({
                    name: d.name,
                    color: d.color,
                    value: String(d.value),
                  }))}
                />
              </div>
            )}
            {revenueBarData.length > 0 && (
              <ChartCard
                title={t.revenueSection}
                description="Top 10 events"
                height={320}
              >
                <BarChart
                  data={revenueBarData}
                  xKey="event"
                  series={[{ key: "revenue", label: t.revenue }]}
                  yFormatter={(v) => `\u20AC${Math.round(v).toLocaleString()}`}
                  horizontal
                />
              </ChartCard>
            )}
          </div>
        );
      })()}

      {/* Orders section */}
      <ReportSection
        title={t.ordersSection}
        rowCount={orders.length}
        previewLimit={PREVIEW_LIMIT}
        onExport={exportOrders}
        labels={{
          export: t.exportCsv,
          showing: t.showing,
          of: t.of,
          rows: t.rows,
          noRows: t.noRows,
        }}
      >
        {orders.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.event}</th>
                <th className="px-4 py-3 text-left font-medium">
                  {t.customer}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t.status}</th>
                <th className="px-4 py-3 text-right font-medium">{t.total}</th>
                <th className="px-4 py-3 text-left font-medium">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, PREVIEW_LIMIT).map((o) => {
                const statusLabel = t[o.status as keyof typeof t] ?? o.status;
                const acqLabel =
                  t[o.acquisitionType as keyof typeof t] ?? o.acquisitionType;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {acqLabel}
                        {o.paymentMethod && ` \u00B7 ${o.paymentMethod}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.recipientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.recipientEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          o.status === "paid" || o.status === "comped"
                            ? "success"
                            : o.status === "pending"
                              ? "warning"
                              : "error"
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {o.totalCents === 0
                        ? "\u2014"
                        : formatMoney(o.totalCents, { currency: o.currency, locale })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(o.createdAt, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportSection>

      {/* Attendees section */}
      <ReportSection
        title={t.attendeesSection}
        rowCount={attendees.length}
        previewLimit={PREVIEW_LIMIT}
        onExport={exportAttendees}
        labels={{
          export: t.exportCsv,
          showing: t.showing,
          of: t.of,
          rows: t.rows,
          noRows: t.noRows,
        }}
      >
        {attendees.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t.attendee}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t.event}</th>
                <th className="px-4 py-3 text-left font-medium">{t.tier}</th>
                <th className="px-4 py-3 text-left font-medium">{t.checkIn}</th>
              </tr>
            </thead>
            <tbody>
              {attendees.slice(0, PREVIEW_LIMIT).map((a) => {
                const acqLabel =
                  t[a.acquisitionType as keyof typeof t] ?? a.acquisitionType;
                return (
                  <tr
                    key={a.ticketId}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.attendeeEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">{a.eventTitle}</td>
                    <td className="px-4 py-3">
                      <p>{a.tierName}</p>
                      <p className="text-xs text-muted-foreground">
                        {acqLabel}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {a.checkedInAt ? (
                        <Badge variant="success">
                          {formatDateTime(a.checkedInAt, locale)}
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          {t.notScanned}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ReportSection>

      {/* Revenue by event section */}
      <ReportSection
        title={t.revenueSection}
        rowCount={revenueByEvent.length}
        previewLimit={PREVIEW_LIMIT}
        onExport={exportRevenue}
        labels={{
          export: t.exportCsv,
          showing: t.showing,
          of: t.of,
          rows: t.rows,
          noRows: t.noRows,
        }}
      >
        {revenueByEvent.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.event}</th>
                <th className="px-4 py-3 text-left font-medium">{t.starts}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.ordersPaid}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.ticketsSold}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.revenue}
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueByEvent.slice(0, PREVIEW_LIMIT).map((r) => (
                <tr
                  key={r.eventId}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{r.eventTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.startsAt
                      ? new Date(r.startsAt).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right">{r.ordersPaid}</td>
                  <td className="px-4 py-3 text-right">{r.ticketsSold}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(r.revenueCents, { currency: r.currency, locale })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      {/* Coupon performance chart */}
      {coupons.length > 0 && (
        <ChartCard
          title={t.couponsSection}
          description={`${coupons.length} code${coupons.length === 1 ? "" : "s"} used`}
          height={Math.max(200, coupons.length * 30 + 40)}
        >
          <BarChart
            data={coupons.slice(0, 10).map((c) => ({
              code: c.code,
              revenue: c.totalRevenueCents / 100,
            }))}
            xKey="code"
            series={[{ key: "revenue", label: t.revenueDriven }]}
            yFormatter={(v) => `\u20AC${Math.round(v).toLocaleString()}`}
            horizontal
          />
        </ChartCard>
      )}

      {/* Coupon performance section */}
      <ReportSection
        title={t.couponsSection}
        rowCount={coupons.length}
        previewLimit={PREVIEW_LIMIT}
        onExport={() => {
          downloadCsv(
            `coupons-${new Date().toISOString().slice(0, 10)}.csv`,
            ["Code", "Uses", "Discount given (cents)", "Revenue driven (cents)"],
            coupons.map((c) => [
              c.code,
              c.uses,
              c.totalDiscountCents,
              c.totalRevenueCents,
            ])
          );
        }}
        labels={{
          export: t.exportCsv,
          showing: t.showing,
          of: t.of,
          rows: t.rows,
          noRows: t.noRows,
        }}
      >
        {coupons.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.couponCode}</th>
                <th className="px-4 py-3 text-right font-medium">{t.uses}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.discountGiven}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.revenueDriven}
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.slice(0, PREVIEW_LIMIT).map((c) => (
                <tr key={c.code} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3 text-right">{c.uses}</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    -{formatMoney(c.totalDiscountCents, { locale })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(c.totalRevenueCents, { locale })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      {/* Event financial summary (P&L) */}
      {financial && (
        <section>
          <h2 className="font-heading text-lg font-semibold">
            {t.financialSection}: {financial.eventTitle}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.finRevenue}
              </p>
              <p className="mt-2 font-heading text-2xl font-bold">
                {formatMoney(financial.revenueCents, { locale })}
              </p>
            </div>
            <div className="rounded-lg border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.finExpenses}
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-red-600">
                -{formatMoney(financial.expensesCents, { locale })}
              </p>
            </div>
            <div className="rounded-lg border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.finProfit}
              </p>
              <p
                className={`mt-2 font-heading text-2xl font-bold ${financial.profitCents >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatMoney(financial.profitCents, { locale })}
              </p>
            </div>
            <div className="rounded-lg border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.finTax}
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-muted-foreground">
                {formatMoney(financial.taxEstimateCents, { locale })}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ReportSection({
  title,
  rowCount,
  previewLimit,
  onExport,
  labels,
  children,
}: {
  title: string;
  rowCount: number;
  previewLimit: number;
  onExport: () => void;
  labels: {
    export: string;
    showing: string;
    of: string;
    rows: string;
    noRows: string;
  };
  children: React.ReactNode;
}) {
  const previewCount = Math.min(rowCount, previewLimit);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <button
          onClick={onExport}
          disabled={rowCount === 0}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {labels.export}
        </button>
      </div>

      {rowCount === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {labels.noRows}
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            {children}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {labels.showing} {previewCount} {labels.of} {rowCount} {labels.rows}
          </p>
        </>
      )}
    </section>
  );
}
