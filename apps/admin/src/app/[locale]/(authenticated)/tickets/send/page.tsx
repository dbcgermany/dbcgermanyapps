import {
  getSendTicketsEvents,
  getSendTicketsTiers,
} from "@/actions/send-tickets";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SendTicketsClient } from "./send-tickets-client";

export default async function SendTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const events = await getSendTicketsEvents();
  const selectedEventId = sp.event ?? events[0]?.id ?? null;
  const tiers = selectedEventId
    ? await getSendTicketsTiers(selectedEventId)
    : [];

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={locale === "de" ? "Tickets senden" : locale === "fr" ? "Envoyer des billets" : "Send Tickets"}
        />

        {events.length === 0 ? (
          <EmptyState
            message={locale === "de"
              ? "Keine bevorstehenden Veranstaltungen."
              : locale === "fr"
                ? "Aucun \u00E9v\u00E9nement \u00E0 venir."
                : "No upcoming events."}
            className="mt-8"
          />
        ) : (
          <SendTicketsClient
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
