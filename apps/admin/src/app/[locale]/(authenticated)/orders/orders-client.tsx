"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import { ORDER_STATUS_VALUES } from "@dbc/types";
import { refundOrder } from "@/actions/orders";
import { CsvExportButton } from "@/components/csv-export-button";

interface Order {
  id: string;
  eventTitle: string;
  totalCents: number;
  status: string;
  acquisitionType: string;
  paymentMethod: string | null;
  recipientName: string;
  recipientEmail: string;
  createdAt: string;
  emailSentAt: string | null;
  stripePaymentIntentId: string | null;
  sellerName: string | null;
}

const STATUS_OPTIONS = ["", ...ORDER_STATUS_VALUES] as const;

export function OrdersClient({
  locale,
  orders,
  events,
  currentEventFilter,
  currentStatusFilter,
}: {
  locale: string;
  orders: Order[];
  events: { id: string; title: string }[];
  currentEventFilter: string;
  currentStatusFilter: string;
}) {
  const router = useRouter();
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateFilters(event?: string, status?: string) {
    const params = new URLSearchParams();
    const ev = event ?? currentEventFilter;
    const st = status ?? currentStatusFilter;
    if (ev) params.set("event", ev);
    if (st) params.set("status", st);
    router.push(`?${params.toString()}`);
  }

  function handleRefund(orderId: string) {
    if (!confirm(t.refundConfirm)) return;
    setError(null);
    setRefundingId(orderId);
    startTransition(async () => {
      const res = await refundOrder(orderId, locale);
      setRefundingId(null);
      if (res.error) {
        setError(res.error);
      }
    });
  }

  const t = {
    en: {
      event: "Event", status: "Status", customer: "Customer", total: "Total", date: "Date", actions: "Actions",
      refund: "Refund", refunding: "Refunding…",
      refundConfirm: "Refund this order? This restores ticket inventory and processes a Stripe refund.",
      all: "All events", allStatus: "All statuses",
      pending: "Pending", paid: "Paid", comped: "Complimentary", refunded: "Refunded", cancelled: "Cancelled",
      purchased: "Purchased", invited: "Invited", assigned: "Assigned", door_sale: "Door sale",
      noOrders: "No orders match your filters.",
      csvOrderId: "Order ID", csvEvent: "Event", csvRecipient: "Recipient",
      csvEmail: "Email", csvStatus: "Status", csvAcquisition: "Acquisition",
      csvPayment: "Payment", csvTotal: "Total (€)", csvStripe: "Stripe PI",
      csvCreated: "Created at", csvEmailSent: "Email sent at",
    },
    de: {
      event: "Veranstaltung", status: "Status", customer: "Kund:in", total: "Gesamt", date: "Datum", actions: "Aktionen",
      refund: "Erstatten", refunding: "Wird erstattet…",
      refundConfirm: "Diese Bestellung erstatten? Das Ticket-Kontingent wird wiederhergestellt und eine Stripe-Rückerstattung ausgelöst.",
      all: "Alle Veranstaltungen", allStatus: "Alle Status",
      pending: "Ausstehend", paid: "Bezahlt", comped: "Kostenlos", refunded: "Erstattet", cancelled: "Storniert",
      purchased: "Gekauft", invited: "Eingeladen", assigned: "Zugewiesen", door_sale: "Abendkasse",
      noOrders: "Keine Bestellungen gefunden.",
      csvOrderId: "Bestell-ID", csvEvent: "Veranstaltung", csvRecipient: "Empfänger:in",
      csvEmail: "E-Mail", csvStatus: "Status", csvAcquisition: "Erhalten durch",
      csvPayment: "Zahlung", csvTotal: "Gesamt (€)", csvStripe: "Stripe PI",
      csvCreated: "Erstellt am", csvEmailSent: "E-Mail gesendet am",
    },
    fr: {
      event: "Événement", status: "Statut", customer: "Client", total: "Total", date: "Date", actions: "Actions",
      refund: "Rembourser", refunding: "Remboursement…",
      refundConfirm: "Rembourser cette commande ? Le stock de billets est rétabli et un remboursement Stripe est déclenché.",
      all: "Tous les événements", allStatus: "Tous les statuts",
      pending: "En attente", paid: "Payé", comped: "Gratuit", refunded: "Remboursé", cancelled: "Annulé",
      purchased: "Acheté", invited: "Invité", assigned: "Attribué", door_sale: "Sur place",
      noOrders: "Aucune commande.",
      csvOrderId: "ID commande", csvEvent: "Événement", csvRecipient: "Destinataire",
      csvEmail: "E-mail", csvStatus: "Statut", csvAcquisition: "Acquisition",
      csvPayment: "Paiement", csvTotal: "Total (€)", csvStripe: "Stripe PI",
      csvCreated: "Créée le", csvEmailSent: "E-mail envoyé le",
    },
  }[locale] ?? {
    event: "Event", status: "Status", customer: "Customer", total: "Total", date: "Date", actions: "Actions",
    refund: "Refund", refunding: "…", refundConfirm: "Refund?",
    all: "All", allStatus: "All",
    pending: "Pending", paid: "Paid", comped: "Comped", refunded: "Refunded", cancelled: "Cancelled",
    purchased: "Purchased", invited: "Invited", assigned: "Assigned", door_sale: "Door sale",
    noOrders: "No orders",
    csvOrderId: "Order ID", csvEvent: "Event", csvRecipient: "Recipient",
    csvEmail: "Email", csvStatus: "Status", csvAcquisition: "Acquisition",
    csvPayment: "Payment", csvTotal: "Total (€)", csvStripe: "Stripe PI",
    csvCreated: "Created at", csvEmailSent: "Email sent at",
  };

  return (
    <div className="mt-6">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={currentEventFilter}
            onChange={(e) => updateFilters(e.target.value, undefined)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.all}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <select
            value={currentStatusFilter}
            onChange={(e) => updateFilters(undefined, e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s === "" ? t.allStatus : t[s as keyof typeof t]}
              </option>
            ))}
          </select>
        </div>
        <CsvExportButton
          filename={`orders-${new Date().toISOString().slice(0, 10)}.csv`}
          rows={orders.map((o) => ({
            id: o.id,
            event: o.eventTitle,
            recipient_name: o.recipientName,
            recipient_email: o.recipientEmail,
            status: o.status,
            acquisition_type: o.acquisitionType,
            payment_method: o.paymentMethod ?? "",
            total_eur: (o.totalCents / 100).toFixed(2),
            stripe_payment_intent: o.stripePaymentIntentId ?? "",
            created_at: o.createdAt,
            email_sent_at: o.emailSentAt ?? "",
          }))}
          headers={[
            { key: "id", label: t.csvOrderId },
            { key: "event", label: t.csvEvent },
            { key: "recipient_name", label: t.csvRecipient },
            { key: "recipient_email", label: t.csvEmail },
            { key: "status", label: t.csvStatus },
            { key: "acquisition_type", label: t.csvAcquisition },
            { key: "payment_method", label: t.csvPayment },
            { key: "total_eur", label: t.csvTotal },
            { key: "stripe_payment_intent", label: t.csvStripe },
            { key: "created_at", label: t.csvCreated },
            { key: "email_sent_at", label: t.csvEmailSent },
          ]}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table (desktop) + iOS-style cell list (mobile) */}
      {orders.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t.noOrders}
        </p>
      ) : (
        <>
        {/* Mobile: grouped-list cells, each a tap target to the order detail */}
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background md:hidden">
          {orders.map((o) => {
            const statusLabel = t[o.status as keyof typeof t] ?? o.status;
            return (
              <li key={o.id}>
                <Link
                  href={`/${locale}/orders/${o.id}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors active:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate font-medium">{o.recipientName}</p>
                      <span className="ml-auto shrink-0 text-sm font-semibold">
                        {o.totalCents === 0
                          ? "\u2014"
                          : `\u20AC${(o.totalCents / 100).toFixed(2)}`}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {o.recipientEmail}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {o.eventTitle}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge
                        variant={
                          o.status === "paid" || o.status === "comped"
                            ? "success"
                            : o.status === "pending"
                              ? "warning"
                              : "error"
                        }
                      >
                        {statusLabel}
                      </Badge>
                      <span>
                        {new Date(o.createdAt).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <span aria-hidden className="mt-1 text-muted-foreground">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop: the table */}
        <div className="mt-6 hidden overflow-hidden rounded-lg border border-border md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.event}</th>
                <th className="px-4 py-3 text-left font-medium">
                  {t.customer}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t.status}</th>
                <th className="px-4 py-3 text-right font-medium">{t.total}</th>
                <th className="px-4 py-3 text-left font-medium">{t.date}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const canRefund =
                  (o.status === "paid" || o.status === "comped") &&
                  o.status !== ("refunded" as string);
                const statusLabel = t[o.status as keyof typeof t] ?? o.status;
                const acqLabel = t[o.acquisitionType as keyof typeof t] ?? o.acquisitionType;

                return (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {acqLabel}
                        {o.paymentMethod && ` \u00B7 ${o.paymentMethod}`}
                        {o.sellerName && ` \u00B7 ${o.sellerName}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/orders/${o.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {o.recipientName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {o.recipientEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          o.status === "paid" || o.status === "comped"
                            ? "success"
                            : o.status === "pending"
                              ? "warning"
                              : "error"
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {o.totalCents === 0
                        ? "\u2014"
                        : `\u20AC${(o.totalCents / 100).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {o.stripePaymentIntentId && (
                          <a
                            href={`https://dashboard.stripe.com/payments/${o.stripePaymentIntentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Stripe &rarr;
                          </a>
                        )}
                        {canRefund && (
                          <button
                            onClick={() => handleRefund(o.id)}
                            disabled={isPending && refundingId === o.id}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            {isPending && refundingId === o.id
                              ? t.refunding
                              : t.refund}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
