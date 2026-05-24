import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getOrders } from "@/actions/orders";
import { PageHeader } from "@/components/page-header";
import { OrdersClient } from "../../../orders/orders-client";

const PT = {
  en: {
    title: "Orders",
    subtitle: "Online purchases + manual door sales for this event.",
    countSuffix: "orders",
  },
  de: {
    title: "Bestellungen",
    subtitle: "Online-Käufe und manuelle Tageskasse-Verkäufe.",
    countSuffix: "Bestellungen",
  },
  fr: {
    title: "Commandes",
    subtitle: "Achats en ligne et ventes manuelles à l'entrée.",
    countSuffix: "commandes",
  },
} as const;

/**
 * Event-scoped orders view. Reuses the global OrdersClient but pre-locks
 * the event filter and renders inside the event hub (PageHeader with
 * back-to-event, event title in description) so operators don't have to
 * re-pick the event from a dropdown when drilling into a single event.
 *
 * The event-select dropdown inside OrdersClient still works — choosing
 * a different event there is harmless, the URL params drive everything
 * and the user can navigate to /events/<other>/orders if they want
 * the same view for another event.
 */
export default async function EventOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ status?: string; page?: string; kind?: string }>;
}) {
  const { locale, id: eventId } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const pt = PT[l];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const kind =
    sp.kind === "allocations" || sp.kind === "all" ? sp.kind : "real";

  let eventTitle: string;
  try {
    const event = await getEvent(eventId);
    eventTitle =
      (event[`title_${l}` as keyof typeof event] as string) || event.title_en;
  } catch {
    notFound();
  }

  const ordersResult = await getOrders({
    eventId,
    status: sp.status,
    page,
    kind,
  });
  const orders = ordersResult.orders;

  return (
    <div>
      <PageHeader
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        title={pt.title}
        description={`${eventTitle} · ${ordersResult.total} ${pt.countSuffix}`}
      />

      <OrdersClient
        locale={locale}
        orders={orders.map((o) => ({
          id: o.id,
          eventTitle: o.event
            ? ((o.event[`title_${locale}` as keyof typeof o.event] as string) ||
              o.event.title_en)
            : "—",
          totalCents: o.total_cents,
          status: o.status,
          acquisitionType: o.acquisition_type,
          paymentMethod: o.payment_method,
          recipientName: o.recipient_name,
          recipientEmail: o.recipient_email,
          createdAt: o.created_at,
          emailSentAt: o.email_sent_at,
          stripePaymentIntentId: o.stripe_payment_intent_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sellerName: (o as any).seller?.display_name ?? null,
        }))}
        // Pre-locked to this event — the event-select inside the client
        // still works but the default is this event.
        events={[{ id: eventId, title: eventTitle }]}
        currentEventFilter={eventId}
        currentStatusFilter={sp.status ?? ""}
        currentKind={kind}
        page={page}
        pageSize={ordersResult.pageSize}
        total={ordersResult.total}
      />
    </div>
  );
}
