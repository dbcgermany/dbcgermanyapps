import { requireRole } from "@dbc/supabase/server";
import { getDashboardKpis } from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { locale } = await params;
  const { from, to } = await searchParams;
  const user = await requireRole("team_member");
  const kpis = await getDashboardKpis(locale, { from, to });

  const T = {
    en: {
      welcome: "Welcome back",
      totalRevenue: "Total revenue",
      ticketsSold: "Tickets sold",
      activeEvents: "Active events",
      checkInRate: "Check-in rate",
      revenue: "Revenue",
      checkIns: "Check-ins by day",
      topEvents: "Top events",
      sold: "sold",
      viewAll: "View all events",
      noData: "No data in this range yet.",
      noEvents: "No events yet.",
      aov: "AOV",
      aovSub: "Avg order value",
      arpa: "ARPA",
      arpaSub: "Avg revenue / attendee",
      netRevenue: "Net revenue",
      netRevenueSub: "Gross \u2212 refunds",
      refundRate: "Refund rate",
      refundRateSub: "Refunded / paid",
      velocity: "Velocity",
      velocitySub: "Tickets/day (7d avg)",
      vsPrior: "vs prior period",
      sellThrough: "Sell-through",
      sellThroughSub: "Sold of capacity per active event",
      capacity: "capacity",
    },
    de: {
      welcome: "Willkommen zur\u00FCck",
      totalRevenue: "Gesamteinnahmen",
      ticketsSold: "Verkaufte Tickets",
      activeEvents: "Aktive Veranstaltungen",
      checkInRate: "Check-in-Rate",
      revenue: "Einnahmen",
      checkIns: "Check-ins pro Tag",
      topEvents: "Top-Veranstaltungen",
      sold: "verkauft",
      viewAll: "Alle Veranstaltungen",
      noData: "Keine Daten in diesem Zeitraum.",
      noEvents: "Noch keine Veranstaltungen.",
      aov: "AOV",
      aovSub: "\u00D8 Bestellwert",
      arpa: "ARPA",
      arpaSub: "\u00D8 Einnahmen / Gast",
      netRevenue: "Netto-Einnahmen",
      netRevenueSub: "Brutto \u2212 Erstattungen",
      refundRate: "Erstattungsquote",
      refundRateSub: "Erstattet / Bezahlt",
      velocity: "Velocity",
      velocitySub: "Tickets/Tag (7\u2011Tage)",
      vsPrior: "vs. Vorperiode",
      sellThrough: "Auslastung",
      sellThroughSub: "Verkauft / Kapazit\u00E4t pro Event",
      capacity: "Kapazit\u00E4t",
    },
    fr: {
      welcome: "Bon retour",
      totalRevenue: "Revenus totaux",
      ticketsSold: "Billets vendus",
      activeEvents: "\u00C9v\u00E9nements actifs",
      checkInRate: "Taux d\u2019enregistrement",
      revenue: "Revenus",
      checkIns: "Enregistrements par jour",
      topEvents: "Meilleurs \u00E9v\u00E9nements",
      sold: "vendus",
      viewAll: "Tous les \u00E9v\u00E9nements",
      noData: "Aucune donn\u00E9e sur la p\u00E9riode.",
      noEvents: "Aucun \u00E9v\u00E9nement.",
      aov: "AOV",
      aovSub: "Panier moyen",
      arpa: "ARPA",
      arpaSub: "Revenu moyen / participant",
      netRevenue: "Revenu net",
      netRevenueSub: "Brut \u2212 remboursements",
      refundRate: "Taux de remboursement",
      refundRateSub: "Rembours\u00E9 / pay\u00E9",
      velocity: "V\u00E9locit\u00E9",
      velocitySub: "Billets/jour (7j)",
      vsPrior: "vs p\u00E9riode pr\u00E9c.",
      sellThrough: "Taux de remplissage",
      sellThroughSub: "Vendu / capacit\u00E9 par \u00E9v\u00E9nement",
      capacity: "capacit\u00E9",
    },
  };
  const t = T[locale as keyof typeof T] ?? T.en;

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold">
        {t.welcome}, {user.email.split("@")[0]}
      </h1>
      <DashboardClient locale={locale} kpis={kpis} t={t} />
    </div>
  );
}
