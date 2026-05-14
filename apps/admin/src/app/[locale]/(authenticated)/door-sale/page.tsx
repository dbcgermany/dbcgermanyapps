import { getTranslations } from "next-intl/server";
import {
  getDoorSaleEvents,
  getEventTiers,
  listOrdersWithPlaceholderEmail,
} from "@/actions/door-sale";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DoorSaleClient } from "./door-sale-client";

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
  const t = await getTranslations({ locale, namespace: "admin.doorSale.page" });

  const events = await getDoorSaleEvents(mode);
  const selectedEventId = sp.event ?? events[0]?.id ?? null;
  const tiers = selectedEventId ? await getEventTiers(selectedEventId) : [];
  // Historic door-sale rows whose attendee_email is still the synthesised
  // `door-sale-<ts>@no-email.local` placeholder from before email was required.
  // Surfaces a collapsible "fix + resend" UI inside the client component.
  const placeholderRows = await listOrdersWithPlaceholderEmail();

  const emptyMsg =
    mode === "door" ? t("emptyDoor") : t("emptyAdvance");

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={mode === "door" ? t("door") : t("advance")} />

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
              {m === "door" ? t("door") : t("advance")}
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
            placeholderRows={placeholderRows}
          />
        )}
      </div>
    </div>
  );
}
