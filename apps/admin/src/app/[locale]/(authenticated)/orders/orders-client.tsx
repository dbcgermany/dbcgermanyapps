"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge, ConfirmDialog } from "@dbc/ui";
import { toast } from "sonner";
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

export type OrderKindFilter = "real" | "allocations" | "all";

export function OrdersClient({
  locale,
  orders,
  events,
  currentEventFilter,
  currentStatusFilter,
  currentKind,
  page,
  pageSize,
  total,
}: {
  locale: string;
  orders: Order[];
  events: { id: string; title: string }[];
  currentEventFilter: string;
  currentStatusFilter: string;
  currentKind: OrderKindFilter;
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const t = useTranslations("admin.orders.client");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildParams(overrides: {
    event?: string;
    status?: string;
    kind?: OrderKindFilter;
    page?: number;
  }) {
    const params = new URLSearchParams();
    const ev = overrides.event ?? currentEventFilter;
    const st = overrides.status ?? currentStatusFilter;
    const kn = overrides.kind ?? currentKind;
    if (ev) params.set("event", ev);
    if (st) params.set("status", st);
    if (kn !== "real") params.set("kind", kn);
    if (overrides.page && overrides.page > 1) {
      params.set("page", String(overrides.page));
    }
    return params;
  }

  function updateFilters(event?: string, status?: string) {
    // Reset to page 1 when filters change.
    router.push(`?${buildParams({ event, status }).toString()}`);
  }

  function setKind(kind: OrderKindFilter) {
    router.push(`?${buildParams({ kind }).toString()}`);
  }

  function goToPage(p: number) {
    router.push(`?${buildParams({ page: p }).toString()}`);
  }

  async function runRefund(orderId: string) {
    setError(null);
    setRefundingId(orderId);
    const res = await refundOrder(orderId, locale);
    setRefundingId(null);
    if (res.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      toast.success(t("refund"));
    }
  }

  return (
    <div className="mt-6">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentEventFilter}
            onChange={(e) => updateFilters(e.target.value, undefined)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("all")}</option>
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
                {s === "" ? t("allStatus") : t(s)}
              </option>
            ))}
          </select>
          {/* Real-vs-allocations tabs. Default ("real") hides internal
              invitations and team assignments so headline counts match
              actual sales. Toggling "allocations" or "all" surfaces them. */}
          <div
            role="tablist"
            aria-label={t("kindFilterLabel")}
            className="inline-flex overflow-hidden rounded-md border border-input bg-background text-sm"
          >
            {(["real", "allocations", "all"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={currentKind === k}
                onClick={() => setKind(k)}
                className={`px-3 py-2 transition-colors ${
                  currentKind === k
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {t(`kind_${k}`)}
              </button>
            ))}
          </div>
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
            { key: "id", label: t("csvOrderId") },
            { key: "event", label: t("csvEvent") },
            { key: "recipient_name", label: t("csvRecipient") },
            { key: "recipient_email", label: t("csvEmail") },
            { key: "status", label: t("csvStatus") },
            { key: "acquisition_type", label: t("csvAcquisition") },
            { key: "payment_method", label: t("csvPayment") },
            { key: "total_eur", label: t("csvTotal") },
            { key: "stripe_payment_intent", label: t("csvStripe") },
            { key: "created_at", label: t("csvCreated") },
            { key: "email_sent_at", label: t("csvEmailSent") },
          ]}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-danger-soft p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table (desktop) + iOS-style cell list (mobile) */}
      {orders.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("noOrders")}
        </p>
      ) : (
        <>
        {/* Mobile: grouped-list cells, each a tap target to the order detail */}
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
          {orders.map((o) => {
            const statusLabel = t.has(o.status) ? t(o.status) : o.status;
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
                <th className="px-4 py-3 text-left font-medium">{t("event")}</th>
                <th className="px-4 py-3 text-left font-medium">
                  {t("customer")}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("total")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("date")}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const canRefund =
                  (o.status === "paid" || o.status === "comped") &&
                  o.status !== ("refunded" as string);
                const statusLabel = t.has(o.status) ? t(o.status) : o.status;
                const acqLabel = t.has(o.acquisitionType) ? t(o.acquisitionType) : o.acquisitionType;

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
                          <ConfirmDialog
                            trigger={
                              <button
                                type="button"
                                disabled={isPending && refundingId === o.id}
                                className="text-xs text-danger hover:opacity-80 disabled:opacity-50"
                              >
                                {isPending && refundingId === o.id
                                  ? t("refunding")
                                  : t("refund")}
                              </button>
                            }
                            title={t("refund")}
                            description={t("refundConfirm")}
                            variant="danger"
                            confirmLabel={t("refund")}
                            onConfirm={() => startTransition(() => runRefund(o.id))}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <nav
            className="mt-4 flex items-center justify-between text-sm"
            aria-label="Pagination"
          >
            <p className="text-muted-foreground">
              {locale === "de"
                ? `Seite ${page} von ${totalPages} · ${total} Bestellungen`
                : locale === "fr"
                  ? `Page ${page} sur ${totalPages} · ${total} commandes`
                  : `Page ${page} of ${totalPages} · ${total} orders`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || isPending}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-50"
              >
                {locale === "de"
                  ? "Zurück"
                  : locale === "fr"
                    ? "Précédent"
                    : "Previous"}
              </button>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || isPending}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-50"
              >
                {locale === "de"
                  ? "Weiter"
                  : locale === "fr"
                    ? "Suivant"
                    : "Next"}
              </button>
            </div>
          </nav>
        )}
        </>
      )}
    </div>
  );
}
