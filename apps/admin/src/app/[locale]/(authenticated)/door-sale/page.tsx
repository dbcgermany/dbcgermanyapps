import { getDoorSaleEvents, getEventTiers } from "@/actions/door-sale";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DoorSaleClient } from "./door-sale-client";

export default async function DoorSalePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const events = await getDoorSaleEvents();
  const selectedEventId = sp.event ?? events[0]?.id ?? null;

  const tiers = selectedEventId ? await getEventTiers(selectedEventId) : [];

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={locale === "de" ? "Abendkasse" : locale === "fr" ? "Vente sur place" : "Door Sale"}
        />

        {events.length === 0 ? (
          <EmptyState
            message={locale === "de"
              ? "Keine bevorstehenden Veranstaltungen in den n\u00E4chsten 30 Tagen."
              : locale === "fr"
                ? "Aucun \u00E9v\u00E9nement \u00E0 venir dans les 30 prochains jours."
                : "No upcoming events in the next 30 days."}
            className="mt-8"
          />
        ) : (
          <DoorSaleClient
            locale={locale}
            events={events.map((e) => ({
              id: e.id,
              title:
                (e[`title_${locale}` as keyof typeof e] as string) ||
                e.title_en,
            }))}
            initialEventId={selectedEventId ?? ""}
            initialTiers={tiers.map((t) => ({
              id: t.id,
              name:
                (t[`name_${locale}` as keyof typeof t] as string) || t.name_en,
              priceCents: t.price_cents,
              remaining:
                t.max_quantity === null
                  ? null
                  : t.max_quantity - t.quantity_sold,
            }))}
          />
        )}
      </div>
    </div>
  );
}
