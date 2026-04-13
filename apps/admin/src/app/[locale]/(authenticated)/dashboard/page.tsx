import Link from "next/link";
import { requireRole } from "@dbc/supabase/server";
import { getDashboardKpis } from "@/actions/dashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireRole("team_member");
  const kpis = await getDashboardKpis(locale);

  const t = {
    en: {
      welcome: "Welcome back",
      totalRevenue: "Total revenue",
      ticketsSold: "Tickets sold",
      activeEvents: "Active events",
      checkInRate: "Check-in rate",
      last30: "Revenue last 30 days",
      topEvents: "Top events",
      revenue: "Revenue",
      sold: "sold",
      viewAll: "View all events",
      noData: "No revenue data yet.",
      noEvents: "No events yet.",
    },
    de: {
      welcome: "Willkommen zur\u00FCck",
      totalRevenue: "Gesamteinnahmen",
      ticketsSold: "Verkaufte Tickets",
      activeEvents: "Aktive Veranstaltungen",
      checkInRate: "Check-in-Rate",
      last30: "Einnahmen der letzten 30 Tage",
      topEvents: "Top-Veranstaltungen",
      revenue: "Einnahmen",
      sold: "verkauft",
      viewAll: "Alle Veranstaltungen anzeigen",
      noData: "Noch keine Einnahmen.",
      noEvents: "Noch keine Veranstaltungen.",
    },
    fr: {
      welcome: "Bon retour",
      totalRevenue: "Revenus totaux",
      ticketsSold: "Billets vendus",
      activeEvents: "\u00C9v\u00E9nements actifs",
      checkInRate: "Taux d\u2019enregistrement",
      last30: "Revenus des 30 derniers jours",
      topEvents: "Meilleurs \u00E9v\u00E9nements",
      revenue: "Revenus",
      sold: "vendus",
      viewAll: "Voir tous les \u00E9v\u00E9nements",
      noData: "Aucun revenu pour le moment.",
      noEvents: "Aucun \u00E9v\u00E9nement.",
    },
  }[locale] ?? {
    welcome: "Welcome", totalRevenue: "Revenue", ticketsSold: "Sold", activeEvents: "Events", checkInRate: "Rate", last30: "Last 30 days", topEvents: "Top", revenue: "Revenue", sold: "sold", viewAll: "All events", noData: "No data", noEvents: "No events",
  };

  const maxDayCents = Math.max(1, ...kpis.revenueByDay.map((d) => d.cents));

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold">
        {t.welcome}, {user.email.split("@")[0]}
      </h1>

      {/* KPI Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Revenue chart */}
      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold">{t.last30}</h2>
        {kpis.revenueByDay.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.noData}
          </p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-1">
            {kpis.revenueByDay.map((d) => {
              const pct = (d.cents / maxDayCents) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 group relative h-full"
                  title={`\u20AC${(d.cents / 100).toFixed(0)} on ${d.date}`}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-primary transition-all group-hover:bg-primary/80"
                    style={{ height: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
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
    </div>
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
