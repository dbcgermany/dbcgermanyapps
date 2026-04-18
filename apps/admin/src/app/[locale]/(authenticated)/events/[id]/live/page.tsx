import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getLiveEventStats } from "@/actions/live-event";
import { LiveClient } from "./live-client";

const T = {
  en: { back: "← Event", title: "Live Event" },
  de: { back: "← Veranstaltung", title: "Live-Veranstaltung" },
  fr: { back: "← Événement", title: "Événement en direct" },
} as const;

export default async function LiveEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const stats = await getLiveEventStats(eventId);

  return (
    <div>
      <Link
        href={`/${locale}/events/${eventId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {t.back}
      </Link>

      <PageHeader title={t.title} className="mt-2" />

      <LiveClient stats={stats} locale={locale} />
    </div>
  );
}
