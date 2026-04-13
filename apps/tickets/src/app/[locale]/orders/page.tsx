import Link from "next/link";
import { createServerClient } from "@dbc/supabase/server";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold">
          {locale === "de" ? "Meine Bestellungen" : locale === "fr" ? "Mes commandes" : "My Orders"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {locale === "de"
            ? "Bitte melden Sie sich an, um Ihre Bestellungen zu sehen."
            : locale === "fr"
              ? "Veuillez vous connecter pour voir vos commandes."
              : "Please sign in to view your orders."}
        </p>
      </main>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, total_cents, status, acquisition_type, recipient_name, created_at, event_id"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch event titles for the orders
  const eventIds = [...new Set((orders ?? []).map((o) => o.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, slug")
    .in("id", eventIds);

  const eventMap = new Map(
    (events ?? []).map((e) => [e.id, e])
  );

  const t = {
    en: { title: "My Orders", noOrders: "You don\u2019t have any orders yet.", status: { pending: "Pending", paid: "Paid", comped: "Complimentary", refunded: "Refunded", cancelled: "Cancelled" } },
    de: { title: "Meine Bestellungen", noOrders: "Sie haben noch keine Bestellungen.", status: { pending: "Ausstehend", paid: "Bezahlt", comped: "Kostenlos", refunded: "Erstattet", cancelled: "Storniert" } },
    fr: { title: "Mes commandes", noOrders: "Vous n\u2019avez pas encore de commandes.", status: { pending: "En attente", paid: "Pay\u00E9", comped: "Gratuit", refunded: "Rembours\u00E9", cancelled: "Annul\u00E9" } },
  }[locale] ?? { title: "My Orders", noOrders: "No orders yet.", status: { pending: "Pending", paid: "Paid", comped: "Complimentary", refunded: "Refunded", cancelled: "Cancelled" } };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-2xl font-bold">{t.title}</h1>

      {!orders || orders.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">{t.noOrders}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const evt = eventMap.get(order.event_id);
            const titleKey = `title_${locale}` as keyof NonNullable<typeof evt>;
            const eventTitle = evt
              ? (evt[titleKey] as string) || evt.title_en
              : "Event";
            const statusLabel =
              t.status[order.status as keyof typeof t.status] || order.status;

            return (
              <Link
                key={order.id}
                href={`/${locale}/confirmation/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-medium">{eventTitle}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {order.total_cents === 0
                      ? locale === "de" ? "Kostenlos" : locale === "fr" ? "Gratuit" : "Free"
                      : `\u20AC${(order.total_cents / 100).toFixed(2)}`}
                  </p>
                  <span
                    className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === "paid" || order.status === "comped"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
