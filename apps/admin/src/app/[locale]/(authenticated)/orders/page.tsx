import { getOrders, getOrdersEvents } from "@/actions/orders";
import { PageHeader } from "@/components/page-header";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string; status?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const [orders, events] = await Promise.all([
    getOrders({ eventId: sp.event, status: sp.status }),
    getOrdersEvents(),
  ]);

  return (
    <div>
      <PageHeader
        title={locale === "de" ? "Bestellungen" : locale === "fr" ? "Commandes" : "Orders"}
      />

      <OrdersClient
        locale={locale}
        orders={orders.map((o) => ({
          id: o.id,
          eventTitle: o.event
            ? ((o.event[`title_${locale}` as keyof typeof o.event] as string) ||
              o.event.title_en)
            : "\u2014",
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
        events={events.map((e) => ({
          id: e.id,
          title:
            (e[`title_${locale}` as keyof typeof e] as string) || e.title_en,
        }))}
        currentEventFilter={sp.event ?? ""}
        currentStatusFilter={sp.status ?? ""}
      />
    </div>
  );
}
