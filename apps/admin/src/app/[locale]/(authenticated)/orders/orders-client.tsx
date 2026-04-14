"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
}

const STATUS_OPTIONS = [
  "",
  "pending",
  "paid",
  "comped",
  "refunded",
  "cancelled",
] as const;

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
    if (!confirm("Refund this order? This restores ticket inventory and processes a Stripe refund.")) {
      return;
    }
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
      refund: "Refund", refunding: "Refunding...",
      all: "All events", allStatus: "All statuses",
      pending: "Pending", paid: "Paid", comped: "Complimentary", refunded: "Refunded", cancelled: "Cancelled",
      purchased: "Purchased", invited: "Invited", assigned: "Assigned", door_sale: "Door sale",
      noOrders: "No orders match your filters.",
    },
    de: {
      event: "Veranstaltung", status: "Status", customer: "Kunde", total: "Gesamt", date: "Datum", actions: "Aktionen",
      refund: "Erstatten", refunding: "Wird erstattet...",
      all: "Alle Veranstaltungen", allStatus: "Alle Status",
      pending: "Ausstehend", paid: "Bezahlt", comped: "Kostenlos", refunded: "Erstattet", cancelled: "Storniert",
      purchased: "Gekauft", invited: "Eingeladen", assigned: "Zugewiesen", door_sale: "Abendkasse",
      noOrders: "Keine Bestellungen gefunden.",
    },
    fr: {
      event: "\u00C9v\u00E9nement", status: "Statut", customer: "Client", total: "Total", date: "Date", actions: "Actions",
      refund: "Rembourser", refunding: "Remboursement...",
      all: "Tous les \u00E9v\u00E9nements", allStatus: "Tous les statuts",
      pending: "En attente", paid: "Pay\u00E9", comped: "Gratuit", refunded: "Rembours\u00E9", cancelled: "Annul\u00E9",
      purchased: "Achet\u00E9", invited: "Invit\u00E9", assigned: "Attribu\u00E9", door_sale: "Sur place",
      noOrders: "Aucune commande.",
    },
  }[locale] ?? {
    event: "Event", status: "Status", customer: "Customer", total: "Total", date: "Date", actions: "Actions",
    refund: "Refund", refunding: "...", all: "All", allStatus: "All",
    pending: "Pending", paid: "Paid", comped: "Comped", refunded: "Refunded", cancelled: "Cancelled",
    purchased: "Purchased", invited: "Invited", assigned: "Assigned", door_sale: "Door sale",
    noOrders: "No orders",
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
            { key: "id", label: "Order ID" },
            { key: "event", label: "Event" },
            { key: "recipient_name", label: "Recipient" },
            { key: "recipient_email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "acquisition_type", label: "Acquisition" },
            { key: "payment_method", label: "Payment" },
            { key: "total_eur", label: "Total (€)" },
            { key: "stripe_payment_intent", label: "Stripe PI" },
            { key: "created_at", label: "Created at" },
            { key: "email_sent_at", label: "Email sent at" },
          ]}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      {orders.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t.noOrders}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
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
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.recipientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.recipientEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.status === "paid" || o.status === "comped"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : o.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {statusLabel}
                      </span>
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
      )}
    </div>
  );
}
