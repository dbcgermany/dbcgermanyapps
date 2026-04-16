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

  const copy = {
    en: {
      title: "My Orders",
      subtitle: "Tickets you've purchased on DBC Germany.",
      signInRequired: "Please sign in to view your orders.",
      empty: "You don't have any orders yet.",
      emptyCta: "Browse events",
      browseHref: `/${locale}`,
      status: {
        pending: "Pending",
        paid: "Paid",
        comped: "Complimentary",
        refunded: "Refunded",
        cancelled: "Cancelled",
      },
      free: "Free",
      viewReceipt: "View receipt",
    },
    de: {
      title: "Meine Bestellungen",
      subtitle: "Tickets, die Sie bei DBC Germany gekauft haben.",
      signInRequired: "Bitte melden Sie sich an, um Ihre Bestellungen zu sehen.",
      empty: "Sie haben noch keine Bestellungen.",
      emptyCta: "Veranstaltungen ansehen",
      browseHref: `/${locale}`,
      status: {
        pending: "Ausstehend",
        paid: "Bezahlt",
        comped: "Kostenlos",
        refunded: "Erstattet",
        cancelled: "Storniert",
      },
      free: "Kostenlos",
      viewReceipt: "Beleg ansehen",
    },
    fr: {
      title: "Mes commandes",
      subtitle: "Billets achetés sur DBC Germany.",
      signInRequired: "Veuillez vous connecter pour voir vos commandes.",
      empty: "Vous n'avez pas encore de commandes.",
      emptyCta: "Voir les événements",
      browseHref: `/${locale}`,
      status: {
        pending: "En attente",
        paid: "Pay\u00E9",
        comped: "Gratuit",
        refunded: "Rembours\u00E9",
        cancelled: "Annul\u00E9",
      },
      free: "Gratuit",
      viewReceipt: "Voir le re\u00E7u",
    },
  };
  const t =
    (copy[locale as keyof typeof copy] as (typeof copy)["en"]) ?? copy.en;

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-4 text-muted-foreground">{t.signInRequired}</p>
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

  const eventIds = [...new Set((orders ?? []).map((o) => o.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, slug")
    .in("id", eventIds);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted-foreground">{t.empty}</p>
          <Link
            href={t.browseHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {t.emptyCta}
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => {
            const evt = eventMap.get(order.event_id);
            const titleKey = `title_${locale}` as keyof NonNullable<typeof evt>;
            const eventTitle = evt
              ? (evt[titleKey] as string) || evt.title_en
              : "Event";
            const statusLabel =
              t.status[order.status as keyof typeof t.status] || order.status;
            const isPaid =
              order.status === "paid" || order.status === "comped";

            return (
              <li key={order.id}>
                <Link
                  href={`/${locale}/confirmation/${order.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{eventTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">
                      {order.total_cents === 0
                        ? t.free
                        : `\u20AC${(order.total_cents / 100).toFixed(2)}`}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPaid
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
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
