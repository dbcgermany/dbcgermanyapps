import { getAssignedEvents, getScanStats } from "@/actions/scan";
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
  const events = await getAssignedEvents();

  // Default to first event or the one in the URL query
  const selectedEventId =
    sp.event ?? (events[0] && "id" in events[0] ? (events[0].id as string) : null);

  const initialStats = selectedEventId
    ? await getScanStats(selectedEventId)
    : { total: 0, checkedIn: 0 };

  return (
    <div className="min-h-full bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-bold">
          {locale === "de" ? "Tickets scannen" : locale === "fr" ? "Scanner les billets" : "Scan Tickets"}
        </h1>

        {events.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            {locale === "de"
              ? "Sie sind keiner Veranstaltung zugewiesen."
              : locale === "fr"
                ? "Vous n\u2019\u00EAtes affect\u00E9 \u00E0 aucun \u00E9v\u00E9nement."
                : "You are not assigned to any events."}
          </div>
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
