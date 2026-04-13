import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const supabase = await createServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, recipient_name, recipient_email, event_id, created_at"
    )
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("title_en, title_de, title_fr, slug, starts_at, venue_name, city")
    .eq("id", order.event_id)
    .single();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "id, attendee_name, attendee_email, ticket_token, tier_id"
    )
    .eq("order_id", orderId);

  const titleKey = `title_${locale}` as keyof NonNullable<typeof event>;
  const eventTitle = event
    ? (event[titleKey] as string) || event.title_en
    : "Event";

  const isPaid = order.status === "paid" || order.status === "comped";

  const t = {
    en: {
      confirmed: "Order Confirmed!",
      pending: "Order Pending",
      subtitle: "Your tickets have been sent to each attendee\u2019s email.",
      pendingSubtitle: "Your payment is being processed. This page will update once confirmed.",
      orderNumber: "Order",
      event: "Event",
      date: "Date",
      tickets: "Tickets",
      total: "Total",
      backToEvents: "Back to events",
    },
    de: {
      confirmed: "Bestellung best\u00E4tigt!",
      pending: "Bestellung ausstehend",
      subtitle: "Ihre Tickets wurden an die E-Mail-Adresse jedes Teilnehmers gesendet.",
      pendingSubtitle: "Ihre Zahlung wird verarbeitet. Diese Seite wird aktualisiert, sobald die Zahlung best\u00E4tigt ist.",
      orderNumber: "Bestellung",
      event: "Veranstaltung",
      date: "Datum",
      tickets: "Tickets",
      total: "Gesamt",
      backToEvents: "Zur\u00FCck zu Veranstaltungen",
    },
    fr: {
      confirmed: "Commande confirm\u00E9e !",
      pending: "Commande en attente",
      subtitle: "Vos billets ont \u00E9t\u00E9 envoy\u00E9s \u00E0 l\u2019e-mail de chaque participant.",
      pendingSubtitle: "Votre paiement est en cours de traitement. Cette page sera mise \u00E0 jour une fois confirm\u00E9.",
      orderNumber: "Commande",
      event: "\u00C9v\u00E9nement",
      date: "Date",
      tickets: "Billets",
      total: "Total",
      backToEvents: "Retour aux \u00E9v\u00E9nements",
    },
  }[locale] ?? {
    confirmed: "Order Confirmed!", pending: "Order Pending", subtitle: "", pendingSubtitle: "", orderNumber: "Order", event: "Event", date: "Date", tickets: "Tickets", total: "Total", backToEvents: "Back to events",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Status header */}
      <div className="text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            isPaid
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-yellow-100 dark:bg-yellow-900/30"
          }`}
        >
          {isPaid ? "\u2713" : "\u23F3"}
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold">
          {isPaid ? t.confirmed : t.pending}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isPaid ? t.subtitle : t.pendingSubtitle}
        </p>
      </div>

      {/* Order details */}
      <div className="mt-10 rounded-xl border border-border p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.orderNumber}</span>
          <span className="font-mono">{orderId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.event}</span>
          <span className="font-medium">{eventTitle}</span>
        </div>
        {event && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.date}</span>
            <span>
              {new Date(event.starts_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.tickets}</span>
          <span>{tickets?.length ?? 0}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between font-medium">
          <span>{t.total}</span>
          <span>
            {order.total_cents === 0
              ? locale === "de"
                ? "Kostenlos"
                : locale === "fr"
                  ? "Gratuit"
                  : "Free"
              : `\u20AC${(order.total_cents / 100).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Ticket list */}
      {tickets && tickets.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-lg font-semibold">{t.tickets}</h2>
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium">{ticket.attendee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.attendee_email}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {ticket.ticket_token.slice(0, 8).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href={`/${locale}`}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          &larr; {t.backToEvents}
        </Link>
      </div>
    </main>
  );
}
