import { getTranslations } from "next-intl/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { getDashboardKpis } from "@/actions/dashboard";
import { getActiveDashboardAds } from "@/actions/dashboard-ads";
import { DashboardAdCarousel } from "@/components/dashboard-ad-carousel";
import { EventCountdown } from "@/components/event-countdown";
import { PageHeader } from "@/components/page-header";
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

  const t = await getTranslations({ locale, namespace: "admin.dashboard.page" });

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
      <PageHeader title={`${t("welcome")}, ${firstName}`} />
      <div className="mt-6">
        <DashboardClient locale={locale} kpis={kpis} />
      </div>
    </div>
  );
}
