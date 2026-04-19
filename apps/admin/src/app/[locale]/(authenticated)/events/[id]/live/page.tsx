import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { getLiveEventStats } from "@/actions/live-event";
import { LiveClient } from "./live-client";

const T = {
  en: { title: "Live Event" },
  de: { title: "Live-Veranstaltung" },
  fr: { title: "Événement en direct" },
} as const;

export default async function LiveEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const stats = await getLiveEventStats(eventId);

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

      <LiveClient stats={stats} locale={locale} />
    </div>
  );
}
