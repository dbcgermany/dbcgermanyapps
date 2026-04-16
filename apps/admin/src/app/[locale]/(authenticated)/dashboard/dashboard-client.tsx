"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  DateRangeSelect,
  type DateRange,
} from "@/components/date-range-select";
import type { DashboardKpis } from "@/actions/dashboard";

type T = {
  totalRevenue: string;
  ticketsSold: string;
  activeEvents: string;
  checkInRate: string;
  revenue: string;
  checkIns: string;
  topEvents: string;
  sold: string;
  viewAll: string;
  noData: string;
  noEvents: string;
  aov: string;
  aovSub: string;
  arpa: string;
  arpaSub: string;
  netRevenue: string;
  netRevenueSub: string;
  refundRate: string;
  refundRateSub: string;
  velocity: string;
  velocitySub: string;
  vsPrior: string;
  sellThrough: string;
  sellThroughSub: string;
  capacity: string;
};

export function DashboardClient({
  locale,
  kpis,
  t,
}: {
  locale: string;
  kpis: DashboardKpis;
  t: T;
}) {
  const router = useRouter();
  const search = useSearchParams();

  const range: DateRange = {
    from: kpis.range.from,
    to: kpis.range.to,
    label: search.get("label") ?? "Last 30 days",
  };

  function handleRangeChange(next: DateRange) {
    const params = new URLSearchParams(Array.from(search.entries()));
    params.set("from", next.from);
    params.set("to", next.to);
    params.set("label", next.label);
    router.push(`?${params.toString()}`);
  }

  const revenueData = kpis.revenueByDay.map((d) => ({
    date: d.date.slice(5),
    eur: d.cents / 100,
  }));
  const checkInData = kpis.checkInsByDay.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  const fmtEur = (cents: number) =>
    `\u20AC${(cents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}`;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <DateRangeSelect value={range} onChange={handleRangeChange} />
        <p className="text-xs text-muted-foreground">
          {range.from} → {range.to}
        </p>
      </div>

      {/* Headline KPI Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t.totalRevenue}
          value={fmtEur(kpis.totalRevenueCents)}
          delta={pctChange(kpis.current.revenueCents, kpis.prior.revenueCents)}
          deltaLabel={t.vsPrior}
        />
        <KpiCard
          label={t.ticketsSold}
          value={kpis.ticketsSold.toLocaleString(locale)}
          delta={pctChange(kpis.current.ticketsSold, kpis.prior.ticketsSold)}
          deltaLabel={t.vsPrior}
        />
        <KpiCard
          label={t.activeEvents}
          value={kpis.activeEventCount.toLocaleString(locale)}
        />
        <KpiCard label={t.checkInRate} value={`${kpis.checkInRate}%`} />
      </div>

      {/* Phase A KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label={t.aov}
          sub={t.aovSub}
          value={fmtEur(kpis.current.aovCents)}
          delta={pctChange(kpis.current.aovCents, kpis.prior.aovCents)}
          deltaLabel={t.vsPrior}
          dense
        />
        <KpiCard
          label={t.arpa}
          sub={t.arpaSub}
          value={fmtEur(kpis.current.arpaCents)}
          delta={pctChange(kpis.current.arpaCents, kpis.prior.arpaCents)}
          deltaLabel={t.vsPrior}
          dense
        />
        <KpiCard
          label={t.netRevenue}
          sub={t.netRevenueSub}
          value={fmtEur(kpis.current.netRevenueCents)}
          delta={pctChange(
            kpis.current.netRevenueCents,
            kpis.prior.netRevenueCents
          )}
          deltaLabel={t.vsPrior}
          dense
        />
        <KpiCard
          label={t.refundRate}
          sub={t.refundRateSub}
          value={`${kpis.refundRatePct.toFixed(1)}%`}
          // Lower is better for refund rate — flip the direction tint
          delta={-pctChange(
            kpis.current.refundCents,
            kpis.prior.refundCents
          )}
          deltaLabel={t.vsPrior}
          dense
        />
        <KpiCard
          label={t.velocity}
          sub={t.velocitySub}
          value={kpis.velocity7dAvg.toFixed(1)}
          dense
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">{t.revenue}</h2>
          {revenueData.every((d) => d.eur === 0) ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t.noData}
            </p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-border"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={11}
                    tickFormatter={(v) =>
                      `\u20AC${Math.round(Number(v)).toLocaleString()}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) =>
                      typeof v === "number"
                        ? `\u20AC${v.toFixed(2)}`
                        : String(v)
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="eur"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">{t.checkIns}</h2>
          {checkInData.every((d) => d.count === 0) ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t.noData}
            </p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkInData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-border"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Sell-through per active event */}
      {kpis.sellThrough.length > 0 && (
        <div className="mt-8 rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">
            {t.sellThrough}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.sellThroughSub}
          </p>
          <ul className="mt-4 space-y-3">
            {kpis.sellThrough.map((s) => (
              <li key={s.eventId}>
                <div className="flex items-center justify-between text-sm">
                  <Link
                    href={`/${locale}/events/${s.eventId}`}
                    className="truncate pr-4 font-medium hover:text-primary"
                  >
                    {s.eventTitle}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {s.sold}/{s.capacity} {t.capacity} · {s.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, s.pct)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top events */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">{t.topEvents}</h2>
          <Link
            href={`/${locale}/events`}
            className="text-sm text-primary hover:text-primary/80"
          >
            {t.viewAll} &rarr;
          </Link>
        </div>

        {kpis.topEvents.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t.noEvents}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t.revenue}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t.sold}
                  </th>
                </tr>
              </thead>
              <tbody>
                {kpis.topEvents.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/events/${e.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {e.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {fmtEur(e.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {e.sold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function pctChange(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100;
  return ((current - prior) / prior) * 100;
}

function KpiCard({
  label,
  sub,
  value,
  delta,
  deltaLabel,
  dense,
}: {
  label: string;
  sub?: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  dense?: boolean;
}) {
  const direction =
    delta === undefined
      ? null
      : Math.abs(delta) < 0.5
        ? "flat"
        : delta > 0
          ? "up"
          : "down";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={`mt-1 font-heading font-bold ${dense ? "text-xl" : "text-2xl"}`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
      )}
      {direction && deltaLabel && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {direction === "up" && (
            <ArrowUpRight
              className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
              strokeWidth={1.75}
            />
          )}
          {direction === "down" && (
            <ArrowDownRight
              className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
              strokeWidth={1.75}
            />
          )}
          {direction === "flat" && (
            <Minus
              className="h-3.5 w-3.5 text-muted-foreground"
              strokeWidth={1.75}
            />
          )}
          <span
            className={
              direction === "up"
                ? "text-green-600 dark:text-green-400"
                : direction === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            }
          >
            {delta !== undefined && Math.abs(delta) < 0.5
              ? "~"
              : delta !== undefined
                ? `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`
                : ""}
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
