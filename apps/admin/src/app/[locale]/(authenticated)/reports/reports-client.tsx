"use client";

import { useRouter } from "next/navigation";
import type {
  OrdersReportRow,
  AttendeesReportRow,
  RevenueByEventRow,
} from "@/actions/reports";

const STATUS_OPTIONS = [
  "",
  "pending",
  "paid",
  "comped",
  "refunded",
  "cancelled",
] as const;

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

function formatMoney(cents: number, currency: string, locale: string): string {
  try {
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency,
    });
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
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
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.status === "paid" || o.status === "comped"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : o.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {o.totalCents === 0
                        ? "\u2014"
                        : formatMoney(o.totalCents, o.currency, locale)}
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
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {formatDateTime(a.checkedInAt, locale)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {t.notScanned}
                        </span>
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
                    {formatMoney(r.revenueCents, r.currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>
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
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
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
