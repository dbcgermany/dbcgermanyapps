"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/stat-card";
import type { LiveEventStats } from "@/actions/live-event";

const T = {
  en: {
    totalTickets: "Total Tickets",
    checkedIn: "Checked In",
    revenue: "Revenue",
    recentCheckIns: "Recent Check-ins",
    ordersByMethod: "Orders by Payment Method",
    noCheckIns: "No check-ins yet.",
    noOrders: "No orders yet.",
    method: "Method",
    count: "Count",
    name: "Name",
    time: "Time",
  },
  de: {
    totalTickets: "Tickets gesamt",
    checkedIn: "Eingecheckt",
    revenue: "Umsatz",
    recentCheckIns: "Letzte Check-ins",
    ordersByMethod: "Bestellungen nach Zahlungsart",
    noCheckIns: "Noch keine Check-ins.",
    noOrders: "Noch keine Bestellungen.",
    method: "Methode",
    count: "Anzahl",
    name: "Name",
    time: "Uhrzeit",
  },
  fr: {
    totalTickets: "Billets total",
    checkedIn: "Enregistr\u00E9s",
    revenue: "Chiffre d\u2019affaires",
    recentCheckIns: "Derniers enregistrements",
    ordersByMethod: "Commandes par mode de paiement",
    noCheckIns: "Aucun enregistrement pour le moment.",
    noOrders: "Aucune commande pour le moment.",
    method: "Mode",
    count: "Nombre",
    name: "Nom",
    time: "Heure",
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

  return (
    <div className="mt-6 space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.totalTickets}
          value={stats.totalTickets.toLocaleString(locale)}
        />
        <StatCard
          label={t.checkedIn}
          value={`${stats.checkedIn.toLocaleString(locale)} (${stats.checkedInPct}%)`}
        />
        <StatCard
          label={t.revenue}
          value={fmtCurrency(stats.revenueCents, locale)}
        />
      </div>

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

      {/* Orders by payment method */}
      <div>
        <h2 className="font-heading text-lg font-semibold">
          {t.ordersByMethod}
        </h2>
        {stats.ordersByMethod.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.noOrders}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">
                    {t.method}
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    {t.count}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.ordersByMethod.map((m) => (
                  <tr
                    key={m.payment_method}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2 capitalize">
                      {m.payment_method ?? "--"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {m.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
