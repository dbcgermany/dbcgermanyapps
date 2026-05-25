"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { formatMoney, Input, Select } from "@dbc/ui";
import { StatCard } from "@/components/stat-card";
import { buildCsv, isoDate } from "@/lib/csv";
import {
  getFinanceOrdersCsv,
  getFinanceSummaryCsv,
  getFinanceRefundsCsv,
  type FinanceSummary,
  type FinanceChannel,
} from "@/actions/reports";

// Finance tab — accountant-grade view. Data is pre-fetched on the server
// (see page.tsx) and passed in; filters live in the URL so the view is
// shareable and history-friendly. CSV exports fire new server-action calls
// using the current URL filters, then build the file client-side via the
// shared csv helper so the BOM + delimiter toggle stays consistent.

interface EventOption {
  id: string;
  title: string;
}

interface FinanceTabProps {
  locale: string;
  summary: FinanceSummary;
  events: EventOption[];
  filters: {
    from: string;
    to: string;
    channel: FinanceChannel | "";
    eventId: string;
  };
}

function fmt(cents: number, currency: string, locale: string) {
  return formatMoney(cents, { currency, locale });
}

function triggerDownload(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  sepa: "SEPA",
  paypal: "PayPal",
  cash: "Cash",
  door_card: "Card (door)",
  door_cash: "Cash (door)",
  allocation: "Allocation",
};

export function FinanceTab({ locale, summary, events, filters }: FinanceTabProps) {
  const router = useRouter();
  const t = useTranslations("admin.reports.financeTab");
  const currency = summary.currency || "EUR";
  const [semicolon, setSemicolon] = useState(locale === "de");
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState<string | null>(null);

  function updateFilter(patch: Partial<FinanceTabProps["filters"]>) {
    const next = { ...filters, ...patch };
    const sp = new URLSearchParams();
    sp.set("tab", "finance");
    if (next.from) sp.set("from", next.from);
    if (next.to) sp.set("to", next.to);
    if (next.channel) sp.set("channel", next.channel);
    if (next.eventId) sp.set("event", next.eventId);
    startTransition(() => router.push(`?${sp.toString()}`));
  }

  function rangeSuffix() {
    const from = filters.from || "all";
    const to = filters.to || isoDate(new Date());
    return `${from}_${to}`;
  }

  async function download<T extends object>(
    kind: "orders" | "summary" | "refunds",
    filename: string,
    columns: string[],
    fetcher: () => Promise<T[]>
  ) {
    setDownloading(kind);
    try {
      const rows = await fetcher();
      const csv = buildCsv(
        rows as unknown as Record<string, string | number | null | undefined>[],
        { columns, delimiter: semicolon ? ";" : "," }
      );
      triggerDownload(filename, csv);
    } finally {
      setDownloading(null);
    }
  }

  const filterArg = {
    from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
    to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
    channel: (filters.channel || undefined) as FinanceChannel | undefined,
    eventId: filters.eventId || undefined,
  };

  const orderColumns = [
    "order_id",
    "created_at",
    "event_slug",
    "event_title_en",
    "channel",
    "acquisition_type",
    "status",
    "payment_method",
    "buyer_name",
    "buyer_email",
    "buyer_country",
    "ticket_count",
    "subtotal_cents",
    "discount_cents",
    "total_cents",
    "currency",
    "refunded_at",
    "refunded_cents",
    "stripe_checkout_session_id",
    "stripe_payment_intent_id",
  ];

  const summaryColumns = [
    "date",
    "channel",
    "payment_method",
    "event_slug",
    "orders",
    "tickets",
    "gross_cents",
    "refund_cents",
    "net_cents",
    "currency",
  ];

  const refundsColumns = [
    "order_id",
    "refunded_at",
    "original_total_cents",
    "refunded_cents",
    "channel",
    "payment_method",
    "buyer_email",
    "event_slug",
  ];

  const methodTotal = summary.paymentMethods.reduce(
    (acc, m) => ({
      orders: acc.orders + m.orders,
      tickets: acc.tickets + m.tickets,
      grossCents: acc.grossCents + m.grossCents,
      refundCents: acc.refundCents + m.refundCents,
      netCents: acc.netCents + m.netCents,
    }),
    { orders: 0, tickets: 0, grossCents: 0, refundCents: 0, netCents: 0 }
  );

  return (
    <div className="space-y-10">
      {/* Filters */}
      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("filters")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t("from")}
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter({ from: e.target.value })}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t("to")}
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter({ to: e.target.value })}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </label>
          <Select
            value={filters.channel}
            onChange={(e) =>
              updateFilter({ channel: e.target.value as FinanceChannel | "" })
            }
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("allChannels")}</option>
            <option value="online">{t("online")}</option>
            <option value="door">{t("door")}</option>
            <option value="allocations">{t("allocations")}</option>
          </Select>
          <Select
            value={filters.eventId}
            onChange={(e) => updateFilter({ eventId: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("allEvents")}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </Select>
          <button
            onClick={() =>
              updateFilter({ from: "", to: "", channel: "", eventId: "" })
            }
            className="ml-auto rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t("clear")}
          </button>
        </div>
        {pending && (
          <p className="mt-2 text-[11px] text-muted-foreground">…</p>
        )}
      </div>

      {/* Channel summary — 4 cards to respect the StatGrid 1/2/4 rule.
          The 4th card is a paid-vs-free mix ratio so the row fills
          without repeating the Online / Door / Comped values. */}
      <section>
        <h2 className="font-heading text-lg font-semibold">
          {t("channelSummary")}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("online")}
            value={fmt(summary.online.netCents, currency, locale)}
            sub={`${summary.online.orders} ${t("orders")} · ${summary.online.tickets} ${t("tickets")} · ${t("onlineSub")}`}
          />
          <StatCard
            label={t("door")}
            value={fmt(summary.door.netCents, currency, locale)}
            sub={`${summary.door.orders} ${t("orders")} · ${summary.door.tickets} ${t("tickets")} · ${t("doorSub")}`}
          />
          <StatCard
            label={t("allocations")}
            value={`${summary.allocations.tickets.toLocaleString(locale)} ${t("tickets")}`}
            sub={`${summary.allocations.orders} ${t("orders")} · ${t("allocationsSub")}`}
          />
          {(() => {
            const paid = summary.online.tickets + summary.door.tickets;
            const free = summary.allocations.tickets;
            const total = paid + free;
            const paidPct = total === 0 ? 0 : (paid / total) * 100;
            const freePct = total === 0 ? 0 : 100 - paidPct;
            return (
              <StatCard
                label={t("channelMix")}
                value={
                  total === 0
                    ? "—"
                    : `${paidPct.toFixed(0)}% / ${freePct.toFixed(0)}%`
                }
                sub={`${t("paid")} ${paid} · ${t("free")} ${free} · ${t("channelMixSub")}`}
              />
            );
          })()}
        </div>
      </section>

      {/* Payment-method breakdown */}
      <section>
        <h2 className="font-heading text-lg font-semibold">
          {t("paymentMethods")}
        </h2>
        {summary.paymentMethods.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("noMethodRows")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    {t("method")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("orders")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("tickets")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("gross")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("refunds")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">{t("net")}</th>
                </tr>
              </thead>
              <tbody>
                {summary.paymentMethods.map((m) => (
                  <tr
                    key={m.method}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">
                      {METHOD_LABELS[m.method] ?? m.method}
                    </td>
                    <td className="px-4 py-3 text-right">{m.orders}</td>
                    <td className="px-4 py-3 text-right">{m.tickets}</td>
                    <td className="px-4 py-3 text-right">
                      {m.channel === "allocations"
                        ? "—"
                        : fmt(m.grossCents, currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-danger">
                      {m.refundCents === 0
                        ? "—"
                        : `-${fmt(m.refundCents, currency, locale)}`}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {m.channel === "allocations"
                        ? "—"
                        : fmt(m.netCents, currency, locale)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/40 font-semibold">
                  <td className="px-4 py-3">{t("total")}</td>
                  <td className="px-4 py-3 text-right">{methodTotal.orders}</td>
                  <td className="px-4 py-3 text-right">
                    {methodTotal.tickets}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fmt(methodTotal.grossCents, currency, locale)}
                  </td>
                  <td className="px-4 py-3 text-right text-danger">
                    {methodTotal.refundCents === 0
                      ? "—"
                      : `-${fmt(methodTotal.refundCents, currency, locale)}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fmt(methodTotal.netCents, currency, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per-event breakdown */}
      <section>
        <h2 className="font-heading text-lg font-semibold">{t("perEvent")}</h2>
        {summary.perEvent.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("noEvents")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t("event")}</th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t("starts")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("online")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">{t("door")}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("allocations")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("gross")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("refunds")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">{t("net")}</th>
                </tr>
              </thead>
              <tbody>
                {summary.perEvent.map((r) => (
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
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmt(r.online.grossCents, currency, locale)}
                      <span className="block text-[11px] text-muted-foreground">
                        {r.online.tickets} {t("tickets")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmt(r.door.grossCents, currency, locale)}
                      <span className="block text-[11px] text-muted-foreground">
                        {r.door.tickets} {t("tickets")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.allocations.tickets} {t("tickets")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmt(r.totalGrossCents, currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-danger">
                      {r.totalRefundCents === 0
                        ? "—"
                        : `-${fmt(r.totalRefundCents, currency, locale)}`}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {fmt(r.totalNetCents, currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Deferred revenue + Stripe fee estimate */}
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("deferredRevenue")}
          value={fmt(summary.deferredRevenueCents, currency, locale)}
          sub={t("deferredRevenueSub")}
        />
        <StatCard
          label={t("stripeFee")}
          value={fmt(summary.stripeFeeEstimateCents, currency, locale)}
          sub={t("stripeFeeSub")}
        />
      </section>

      {/* VAT note */}
      <section className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        {t("vatNote")}
      </section>

      {/* Exports */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">{t("exports")}</h2>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Input
              type="checkbox"
              checked={semicolon}
              onChange={(e) => setSemicolon(e.target.checked)}
              className="h-4 w-4"
            />
            {t("semicolon")}
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ExportCard
            title={t("exportOrders")}
            sub={t("exportOrdersSub")}
            loading={downloading === "orders"}
            loadingLabel={t("downloading")}
            onClick={() =>
              download(
                "orders",
                `finance-orders-${rangeSuffix()}.csv`,
                orderColumns,
                () => getFinanceOrdersCsv(filterArg)
              )
            }
          />
          <ExportCard
            title={t("exportSummary")}
            sub={t("exportSummarySub")}
            loading={downloading === "summary"}
            loadingLabel={t("downloading")}
            onClick={() =>
              download(
                "summary",
                `finance-summary-${rangeSuffix()}.csv`,
                summaryColumns,
                () => getFinanceSummaryCsv(filterArg)
              )
            }
          />
          <ExportCard
            title={t("exportRefunds")}
            sub={t("exportRefundsSub")}
            loading={downloading === "refunds"}
            loadingLabel={t("downloading")}
            onClick={() =>
              download(
                "refunds",
                `finance-refunds-${rangeSuffix()}.csv`,
                refundsColumns,
                () => getFinanceRefundsCsv(filterArg)
              )
            }
          />
        </div>
      </section>
    </div>
  );
}

function ExportCard({
  title,
  sub,
  onClick,
  loading,
  loadingLabel,
}: {
  title: string;
  sub: string;
  onClick: () => void;
  loading: boolean;
  loadingLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group flex flex-col items-start gap-1 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40 disabled:opacity-50"
    >
      <span className="font-heading text-sm font-semibold">
        {loading ? loadingLabel : title}
      </span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </button>
  );
}
