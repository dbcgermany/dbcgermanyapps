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

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <DateRangeSelect value={range} onChange={handleRangeChange} />
        <p className="text-xs text-muted-foreground">
          {range.from} → {range.to}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t.totalRevenue}
          value={`\u20AC${(kpis.totalRevenueCents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}`}
        />
        <KpiCard
          label={t.ticketsSold}
          value={kpis.ticketsSold.toLocaleString(locale)}
        />
        <KpiCard
          label={t.activeEvents}
          value={kpis.activeEventCount.toLocaleString(locale)}
        />
        <KpiCard label={t.checkInRate} value={`${kpis.checkInRate}%`} />
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
                      &euro;{(e.revenue / 100).toFixed(2)}
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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
    </div>
  );
}
