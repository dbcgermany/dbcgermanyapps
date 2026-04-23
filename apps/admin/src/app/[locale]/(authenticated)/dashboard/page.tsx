import { createServerClient, requireRole } from "@dbc/supabase/server";
import { getDashboardKpis } from "@/actions/dashboard";
import { getActiveDashboardAds } from "@/actions/dashboard-ads";
import { DashboardAdCarousel } from "@/components/dashboard-ad-carousel";
import { EventCountdown } from "@/components/event-countdown";
import { DashboardClient } from "./dashboard-client";

// Pull the next upcoming event (published or not — operators need to
// see drafts they're prepping) so the countdown banner can show exact
// time-to-doors. Null when no future event exists.
async function getNextUpcomingEvent(locale: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at, venue_name, city")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const localizedTitle =
    locale === "de"
      ? data.title_de
      : locale === "fr"
        ? data.title_fr
        : data.title_en;
  const venueName = (data.venue_name as string | null) ?? null;
  const city = (data.city as string | null) ?? null;
  const venue = [venueName, city].filter(Boolean).join(", ") || null;
  return {
    id: data.id as string,
    title: (localizedTitle as string | null) || (data.title_en as string),
    startsAtIso: data.starts_at as string,
    venue,
  };
}

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
  const supabase = await createServerClient();
  const [kpis, profileRes, ads, nextEvent] = await Promise.all([
    getDashboardKpis(locale, { from, to }),
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.userId)
      .maybeSingle(),
    getActiveDashboardAds(),
    getNextUpcomingEvent(locale),
  ]);

  // Prefer profile display_name first word, fall back to email local part
  const displayName = profileRes.data?.display_name?.trim() || null;
  const firstName = displayName
    ? displayName.split(/\s+/)[0]
    : user.email.split("@")[0];

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
      abandonedCheckouts: "Abandoned checkouts",
      abandonedCheckoutsSub: "Reached Stripe, never paid",
      abandonedRevenue: "Abandoned value",
      abandonedRevenueSub: "Potential revenue lost",
      salesByChannel: "Sales by channel",
      online: "Online",
      onlineSub: "Self-serve via Stripe",
      door: "Door",
      doorSub: "Sold at the venue",
      comped: "Comped",
      compedSub: "Invited / assigned \u2014 zero revenue",
      tickets: "tickets",
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
      abandonedCheckouts: "Abgebrochene Checkouts",
      abandonedCheckoutsSub: "Auf Stripe gelandet, nicht bezahlt",
      abandonedRevenue: "Verlorener Umsatz",
      abandonedRevenueSub: "Potenzielle Einnahmen verpasst",
      salesByChannel: "Verk\u00E4ufe nach Kanal",
      online: "Online",
      onlineSub: "Selbstbedienung \u00FCber Stripe",
      door: "Vor Ort",
      doorSub: "Am Einlass verkauft",
      comped: "Freikarten",
      compedSub: "Eingeladen / zugewiesen \u2014 kein Umsatz",
      tickets: "Tickets",
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
      abandonedCheckouts: "Paniers abandonn\u00E9s",
      abandonedCheckoutsSub: "Arriv\u00E9s sur Stripe, non pay\u00E9s",
      abandonedRevenue: "Valeur perdue",
      abandonedRevenueSub: "Revenus potentiels manqu\u00E9s",
      salesByChannel: "Ventes par canal",
      online: "En ligne",
      onlineSub: "Achat direct via Stripe",
      door: "Sur place",
      doorSub: "Vendus au guichet",
      comped: "Invitations",
      compedSub: "Invit\u00E9s / attribu\u00E9s \u2014 sans revenu",
      tickets: "billets",
    },
  };
  const t = T[locale as keyof typeof T] ?? T.en;

  return (
    <div>
      {nextEvent && (
        <EventCountdown
          title={nextEvent.title}
          startsAtIso={nextEvent.startsAtIso}
          venue={nextEvent.venue}
          locale={locale}
          href={`/${locale}/events/${nextEvent.id}`}
        />
      )}
      <DashboardAdCarousel ads={ads} locale={locale} />
      <h1 className="font-heading text-2xl font-bold">
        {t.welcome}, {firstName}
      </h1>
      <DashboardClient locale={locale} kpis={kpis} t={t} />
    </div>
  );
}
