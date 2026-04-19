"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@dbc/ui";
import {
  DateRangeSelect,
  type DateRange,
} from "@/components/date-range-select";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import { EmptyState } from "@/components/empty-state";
import { AreaChart, BarChart, ChartCard } from "@/components/charts";
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
  const tRange = useTranslations("admin.dashboard.dateRange");

  const range: DateRange = {
    from: kpis.range.from,
    to: kpis.range.to,
    label: search.get("label") ?? tRange("last30Days"),
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

      {/* Headline KPIs — 4 cards */}
      <div className="mt-6">
        <StatGrid cols={4}>
          <StatCard
            label={t.totalRevenue}
            value={fmtEur(kpis.totalRevenueCents)}
            delta={pctChange(kpis.current.revenueCents, kpis.prior.revenueCents)}
            deltaLabel={t.vsPrior}
          />
          <StatCard
            label={t.ticketsSold}
            value={kpis.ticketsSold.toLocaleString(locale)}
            delta={pctChange(kpis.current.ticketsSold, kpis.prior.ticketsSold)}
            deltaLabel={t.vsPrior}
          />
          <StatCard
            label={t.activeEvents}
            value={kpis.activeEventCount.toLocaleString(locale)}
          />
          <StatCard label={t.checkInRate} value={`${kpis.checkInRate}%`} />
        </StatGrid>
      </div>

      {/* Secondary KPIs — 4 cards (velocity moved to revenue chart subtitle) */}
      <div className="mt-4">
        <StatGrid cols={4}>
          <StatCard
            label={t.aov}
            sub={t.aovSub}
            value={fmtEur(kpis.current.aovCents)}
            delta={pctChange(kpis.current.aovCents, kpis.prior.aovCents)}
            deltaLabel={t.vsPrior}
            dense
          />
          <StatCard
            label={t.arpa}
            sub={t.arpaSub}
            value={fmtEur(kpis.current.arpaCents)}
            delta={pctChange(kpis.current.arpaCents, kpis.prior.arpaCents)}
            deltaLabel={t.vsPrior}
            dense
          />
          <StatCard
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
          <StatCard
            label={t.refundRate}
            sub={t.refundRateSub}
            value={`${kpis.refundRatePct.toFixed(1)}%`}
            delta={-pctChange(
              kpis.current.refundCents,
              kpis.prior.refundCents
            )}
            deltaLabel={t.vsPrior}
            dense
          />
        </StatGrid>
      </div>

      {/* Charts — 2 wide */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {revenueData.every((d) => d.eur === 0) ? (
          <Card padding="md" className="rounded-lg">
            <h2 className="font-heading text-sm font-semibold">{t.revenue}</h2>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t.noData}
            </p>
          </Card>
        ) : (
          <ChartCard
            title={t.revenue}
            description={`${t.velocity}: ${kpis.velocity7dAvg.toFixed(1)} ${t.velocitySub.toLowerCase()}`}
          >
            <AreaChart
              data={revenueData}
              xKey="date"
              series={[{ key: "eur", label: t.revenue }]}
              yFormatter={(v) =>
                `\u20AC${Math.round(v).toLocaleString()}`
              }
            />
          </ChartCard>
        )}

        {checkInData.every((d) => d.count === 0) ? (
          <Card padding="md" className="rounded-lg">
            <h2 className="font-heading text-sm font-semibold">{t.checkIns}</h2>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t.noData}
            </p>
          </Card>
        ) : (
          <ChartCard title={t.checkIns}>
            <BarChart
              data={checkInData}
              xKey="date"
              series={[{ key: "count", label: t.checkIns, color: "#d4a017" }]}
            />
          </ChartCard>
        )}
      </div>

      {/* Sell-through per active event */}
      {kpis.sellThrough.length > 0 && (
        <Card padding="md" className="mt-8 rounded-lg">
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
        </Card>
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
          <EmptyState message={t.noEvents} className="mt-6" />
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

