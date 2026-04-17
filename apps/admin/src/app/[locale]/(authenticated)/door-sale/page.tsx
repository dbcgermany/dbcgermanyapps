import { getDoorSaleEvents, getEventTiers } from "@/actions/door-sale";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DoorSaleClient } from "./door-sale-client";

const TITLES = {
  en: { door: "Door Sale", advance: "Advance Sale" },
  de: { door: "Abendkasse", advance: "Vorverkauf" },
  fr: { door: "Vente sur place", advance: "Pr\u00E9vente" },
} as const;

export default async function DoorSalePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string; mode?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const mode = sp.mode === "advance" ? "advance" : "door";
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";

  const events = await getDoorSaleEvents(mode);
  const selectedEventId = sp.event ?? events[0]?.id ?? null;
  const tiers = selectedEventId ? await getEventTiers(selectedEventId) : [];

  const emptyMsg = {
    en: mode === "door"
      ? "No upcoming events in the next 30 days."
      : "No upcoming events.",
    de: mode === "door"
      ? "Keine bevorstehenden Veranstaltungen in den n\u00E4chsten 30 Tagen."
      : "Keine bevorstehenden Veranstaltungen.",
    fr: mode === "door"
      ? "Aucun \u00E9v\u00E9nement \u00E0 venir dans les 30 prochains jours."
      : "Aucun \u00E9v\u00E9nement \u00E0 venir.",
  }[l];

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={TITLES[l][mode]} />

        {/* Mode toggle */}
        <div className="mt-4 flex gap-1 rounded-md border border-border p-1 w-fit">
          {(["door", "advance"] as const).map((m) => (
            <a
              key={m}
              href={`?mode=${m}${sp.event ? `&event=${sp.event}` : ""}`}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TITLES[l][m]}
            </a>
          ))}
        </div>

        {events.length === 0 ? (
          <EmptyState message={emptyMsg} className="mt-8" />
        ) : (
          <DoorSaleClient
            locale={locale}
            mode={mode}
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
