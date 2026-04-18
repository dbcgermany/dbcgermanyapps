import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getLiveEventStats } from "@/actions/live-event";
import { LiveClient } from "./live-client";

export default async function LiveEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const stats = await getLiveEventStats(eventId);

  return (
    <div>
      <Link
        href={`/${locale}/events/${eventId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Event
      </Link>

      <PageHeader title="Live Event" className="mt-2" />

      <LiveClient stats={stats} locale={locale} />
    </div>
  );
}
