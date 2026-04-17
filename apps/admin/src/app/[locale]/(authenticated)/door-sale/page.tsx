import { getDoorSaleEvents, getEventTiers } from "@/actions/door-sale";
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
        <h1 className="font-heading text-2xl font-bold">
          {locale === "de" ? "Abendkasse" : locale === "fr" ? "Vente sur place" : "Door Sale"}
        </h1>

        {events.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            {locale === "de"
              ? "Keine bevorstehenden Veranstaltungen in den n\u00E4chsten 30 Tagen."
              : locale === "fr"
                ? "Aucun \u00E9v\u00E9nement \u00E0 venir dans les 30 prochains jours."
                : "No upcoming events in the next 30 days."}
          </div>
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
