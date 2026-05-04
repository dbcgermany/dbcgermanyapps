import { getTranslations } from "next-intl/server";
import { getAssignedEvents, getScanStats } from "@/actions/scan";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ScanClient } from "./scan-client";

export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "admin.scan" });
  const events = await getAssignedEvents();

  // Default to first event or the one in the URL query
  const selectedEventId =
    sp.event ?? (events[0] && "id" in events[0] ? (events[0].id as string) : null);

  const initialStats = selectedEventId
    ? await getScanStats(selectedEventId)
    : { total: 0, checkedIn: 0 };

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t("pageTitle")} />

        {events.length === 0 ? (
          <EmptyState message={t("notAssignedMessage")} className="mt-8" />
        ) : (
          <ScanClient
            locale={locale}
            events={events.map((e) => ({
              id: (e as { id: string }).id,
              title:
                ((e as Record<string, unknown>)[`title_${locale}`] as string) ||
                ((e as { title_en: string }).title_en),
            }))}
            initialEventId={selectedEventId ?? ""}
            initialStats={initialStats}
          />
        )}
      </div>
    </div>
  );
}
