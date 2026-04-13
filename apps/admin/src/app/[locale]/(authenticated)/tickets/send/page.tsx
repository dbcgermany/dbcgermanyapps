import {
  getSendTicketsEvents,
  getSendTicketsTiers,
} from "@/actions/send-tickets";
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
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-2xl font-bold">
          {locale === "de" ? "Tickets senden" : locale === "fr" ? "Envoyer des billets" : "Send Tickets"}
        </h1>

        {events.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            {locale === "de"
              ? "Keine bevorstehenden Veranstaltungen."
              : locale === "fr"
                ? "Aucun \u00E9v\u00E9nement \u00E0 venir."
                : "No upcoming events."}
          </div>
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
