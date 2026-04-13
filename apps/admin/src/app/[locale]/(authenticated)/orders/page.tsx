import { getOrders, getOrdersEvents } from "@/actions/orders";
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
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold">
        {locale === "de" ? "Bestellungen" : locale === "fr" ? "Commandes" : "Orders"}
      </h1>

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
