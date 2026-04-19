"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import { refundOrder } from "@/actions/orders";

interface Ticket {
  id: string;
  ticket_token: string;
  attendee_name: string;
  attendee_email: string;
  checked_in_at: string | null;
  tier: { id: string; name_en: string; name_de: string | null; name_fr: string | null; price_cents: number } | null;
}

interface OrderData {
  id: string;
  event_id: string;
  contact_id: string | null;
  coupon_id: string | null;
  subtotal_cents: number | null;
  discount_cents: number | null;
  total_cents: number;
  currency: string | null;
  status: string;
  acquisition_type: string;
  payment_method: string | null;
  recipient_name: string;
  recipient_email: string;
  locale: string | null;
  created_at: string;
  email_sent_at: string | null;
  stripe_payment_intent_id: string | null;
  seller: { display_name: string | null } | null;
}

interface ContactData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface CouponData {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
}

export function OrderDetailClient({
  order,
  tickets,
  contact,
  coupon,
  locale,
}: {
  order: OrderData;
  tickets: Ticket[];
  contact: ContactData | null;
  coupon: CouponData | null;
  locale: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const t = {
    en: {
      downloadInvoice: "Download invoice",
      refundConfirm: "Refund order?",
      customer: "Customer",
      lineItems: "Tickets",
      payment: "Payment",
      timeline: "Timeline",
      refund: "Refund order",
      refunding: "Refunding…",
      tier: "Tier",
      attendee: "Attendee",
      checkedIn: "Checked in",
      notCheckedIn: "Not checked in",
      method: "Payment method",
      subtotal: "Subtotal",
      discount: "Discount",
      total: "Total",
      couponCode: "Coupon",
      stripeLink: "View in Stripe",
      created: "Order created",
      emailSent: "Email sent",
      noTickets: "No tickets",
      viewContact: "View contact",
      cash: "Cash",
      bank_transfer: "Bank transfer",
      stripe: "Stripe",
    },
    de: {
      downloadInvoice: "Rechnung herunterladen",
      refundConfirm: "Bestellung erstatten?",
      customer: "Kund:in",
      lineItems: "Tickets",
      payment: "Zahlung",
      timeline: "Verlauf",
      refund: "Bestellung erstatten",
      refunding: "Wird erstattet…",
      tier: "Kategorie",
      attendee: "Teilnehmer:in",
      checkedIn: "Eingecheckt",
      notCheckedIn: "Nicht eingecheckt",
      method: "Zahlungsmethode",
      subtotal: "Zwischensumme",
      discount: "Rabatt",
      total: "Gesamt",
      couponCode: "Gutschein",
      stripeLink: "In Stripe ansehen",
      created: "Bestellung erstellt",
      emailSent: "E-Mail gesendet",
      noTickets: "Keine Tickets",
      viewContact: "Kontakt ansehen",
      cash: "Bargeld",
      bank_transfer: "\u00DCberweisung",
      stripe: "Stripe",
    },
    fr: {
      downloadInvoice: "Télécharger la facture",
      refundConfirm: "Rembourser la commande ?",
      customer: "Client",
      lineItems: "Billets",
      payment: "Paiement",
      timeline: "Chronologie",
      refund: "Rembourser",
      refunding: "Remboursement…",
      tier: "Cat\u00E9gorie",
      attendee: "Participant\u00B7e",
      checkedIn: "Enregistr\u00E9",
      notCheckedIn: "Non enregistr\u00E9",
      method: "Mode de paiement",
      subtotal: "Sous-total",
      discount: "R\u00E9duction",
      total: "Total",
      couponCode: "Coupon",
      stripeLink: "Voir sur Stripe",
      created: "Commande cr\u00E9\u00E9e",
      emailSent: "E-mail envoy\u00E9",
      noTickets: "Aucun billet",
      viewContact: "Voir le contact",
      cash: "Esp\u00E8ces",
      bank_transfer: "Virement",
      stripe: "Stripe",
    },
  }[locale] ?? {
    downloadInvoice: "Download invoice", refundConfirm: "Refund?",
    customer: "Customer", lineItems: "Tickets", payment: "Payment", timeline: "Timeline",
    refund: "Refund", refunding: "…", tier: "Tier", attendee: "Attendee",
    checkedIn: "Checked in", notCheckedIn: "Not checked in", method: "Method",
    subtotal: "Subtotal", discount: "Discount", total: "Total", couponCode: "Coupon",
    stripeLink: "Stripe", created: "Created", emailSent: "Email sent",
    noTickets: "No tickets", viewContact: "View contact",
    cash: "Cash", bank_transfer: "Bank transfer", stripe: "Stripe",
  };

  const canRefund = order.status === "paid" || order.status === "comped";
  const currency = order.currency || "EUR";

  function fmt(cents: number) {
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency,
    });
  }

  function handleRefund() {
    if (!confirm(t.refundConfirm)) return;
    startTransition(async () => {
      const res = await refundOrder(order.id, locale);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";

  function tierName(tier: Ticket["tier"]) {
    if (!tier) return "—";
    return (tier[`name_${l}` as keyof typeof tier] as string) || tier.name_en;
  }

  const paymentLabel =
    order.payment_method === "cash" ? t.cash
    : order.payment_method === "bank_transfer" ? t.bank_transfer
    : order.stripe_payment_intent_id ? t.stripe
    : order.payment_method ?? "—";

  return (
    <div className="mt-8 space-y-8">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/invoice/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t.downloadInvoice}
        </a>
        {canRefund && (
          <>
          <button
            onClick={handleRefund}
            disabled={isPending}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isPending ? t.refunding : t.refund}
          </button>
          {order.stripe_payment_intent_id && (
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t.stripeLink} &rarr;
            </a>
          )}
        </>
      )}
      </div>

      {/* Customer card */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.customer}
        </h2>
        <div className="mt-3">
          <p className="font-medium">{order.recipient_name}</p>
          <p className="text-sm text-muted-foreground">{order.recipient_email}</p>
          {contact && (
            <Link
              href={`/${locale}/contacts/${contact.id}`}
              className="mt-2 inline-block text-xs text-primary hover:text-primary/80"
            >
              {t.viewContact} &rarr;
            </Link>
          )}
        </div>
      </section>

      {/* Line items */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.lineItems}
        </h2>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.noTickets}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {tickets.map((tk) => (
              <div
                key={tk.id}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {tierName(tk.tier)}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      #{tk.ticket_token.slice(0, 8).toUpperCase()}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tk.attendee_name} &middot; {tk.attendee_email}
                  </p>
                </div>
                <Badge variant={tk.checked_in_at ? "success" : "default"}>
                  {tk.checked_in_at
                    ? `${t.checkedIn} ${new Date(tk.checked_in_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
                    : t.notCheckedIn}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment card */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.payment}
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t.method}</dt>
            <dd className="font-medium">{paymentLabel}</dd>
          </div>
          {order.seller?.display_name && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sold by</dt>
              <dd className="font-medium">{order.seller.display_name}</dd>
            </div>
          )}
          {order.subtotal_cents != null && order.subtotal_cents !== order.total_cents && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.subtotal}</dt>
              <dd>{fmt(order.subtotal_cents)}</dd>
            </div>
          )}
          {order.discount_cents != null && order.discount_cents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t.discount}
                {coupon && (
                  <span className="ml-1 font-mono text-xs text-primary">
                    {coupon.code}
                  </span>
                )}
              </dt>
              <dd className="text-green-600">-{fmt(order.discount_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <dt>{t.total}</dt>
            <dd>{order.total_cents === 0 ? "—" : fmt(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      {/* Timeline */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.timeline}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{t.created}</span>
            <span className="ml-auto font-medium">
              {new Date(order.created_at).toLocaleString(locale, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
          {order.email_sent_at && (
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{t.emailSent}</span>
              <span className="ml-auto font-medium">
                {new Date(order.email_sent_at).toLocaleString(locale, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          )}
          {tickets
            .filter((tk) => tk.checked_in_at)
            .map((tk) => (
              <li key={tk.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  {t.checkedIn}: {tk.attendee_name}
                </span>
                <span className="ml-auto font-medium">
                  {new Date(tk.checked_in_at!).toLocaleString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
