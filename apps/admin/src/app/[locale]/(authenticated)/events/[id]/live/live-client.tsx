"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import { ChartCard, DonutChart, ChartLegend, CHART_COLORS } from "@/components/charts";
import type { LiveEventStats } from "@/actions/live-event";

const T = {
  en: {
    totalTickets: "Total Tickets",
    checkedIn: "Checked In",
    stillToArrive: "Still to Arrive",
    revenue: "Revenue",
    recentCheckIns: "Recent Check-ins",
    ordersByMethod: "Orders by Payment Method",
    noCheckIns: "No check-ins yet.",
    noOrders: "No orders yet.",
    method: "Method",
    count: "Count",
    name: "Name",
    time: "Time",
    total: "Total",
  },
  de: {
    totalTickets: "Tickets gesamt",
    checkedIn: "Eingecheckt",
    stillToArrive: "Noch ausstehend",
    revenue: "Umsatz",
    recentCheckIns: "Letzte Check-ins",
    ordersByMethod: "Bestellungen nach Zahlungsart",
    noCheckIns: "Noch keine Check-ins.",
    noOrders: "Noch keine Bestellungen.",
    method: "Methode",
    count: "Anzahl",
    name: "Name",
    time: "Uhrzeit",
    total: "Gesamt",
  },
  fr: {
    totalTickets: "Billets total",
    checkedIn: "Enregistr\u00E9s",
    stillToArrive: "\u00C0 venir",
    revenue: "Chiffre d\u2019affaires",
    recentCheckIns: "Derniers enregistrements",
    ordersByMethod: "Commandes par mode de paiement",
    noCheckIns: "Aucun enregistrement pour le moment.",
    noOrders: "Aucune commande pour le moment.",
    method: "Mode",
    count: "Nombre",
    name: "Nom",
    time: "Heure",
    total: "Total",
  },
} as const;

type Locale = keyof typeof T;

function fmtCurrency(cents: number, locale: string) {
  return new Intl.NumberFormat(locale || "en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale || "en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LiveClient({
  stats,
  locale,
}: {
  stats: LiveEventStats;
  locale: string;
}) {
  const router = useRouter();
  const l = (["en", "de", "fr"].includes(locale) ? locale : "en") as Locale;
  const t = T[l];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  const stillToArrive = Math.max(0, stats.totalTickets - stats.checkedIn);

  // Transform orders-by-method for donut
  const paymentData = stats.ordersByMethod.map((m, i) => ({
    name: (m.payment_method || "other").replace("_", " "),
    value: m.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const totalOrders = paymentData.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="mt-6 space-y-8">
      {/* Stat cards — 4 cards */}
      <StatGrid cols={4}>
        <StatCard
          label={t.totalTickets}
          value={stats.totalTickets.toLocaleString(locale)}
        />
        <StatCard
          label={t.checkedIn}
          value={`${stats.checkedIn.toLocaleString(locale)} (${stats.checkedInPct}%)`}
        />
        <StatCard
          label={t.stillToArrive}
          value={stillToArrive.toLocaleString(locale)}
        />
        <StatCard
          label={t.revenue}
          value={fmtCurrency(stats.revenueCents, locale)}
        />
      </StatGrid>

      {/* Recent check-ins */}
      <div>
        <h2 className="font-heading text-lg font-semibold">{t.recentCheckIns}</h2>
        {stats.recentCheckIns.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.noCheckIns}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">{t.name}</th>
                  <th className="px-4 py-2 text-left font-medium">{t.time}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCheckIns.map((ci, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{ci.attendee_name ?? "--"}</td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {fmtTime(ci.checked_in_at, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Orders by payment method — donut chart */}
      {paymentData.length > 0 ? (
        <ChartCard title={t.ordersByMethod} height={260}>
          <DonutChart
            data={paymentData}
            centerLabel={t.total}
            centerValue={totalOrders.toLocaleString(locale)}
          />
        </ChartCard>
      ) : (
        <div>
          <h2 className="font-heading text-lg font-semibold">
            {t.ordersByMethod}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.noOrders}</p>
        </div>
      )}
      {paymentData.length > 0 && (
        <ChartLegend
          items={paymentData.map((p) => ({
            name: p.name,
            color: p.color,
            value: String(p.value),
          }))}
        />
      )}
    </div>
  );
}
