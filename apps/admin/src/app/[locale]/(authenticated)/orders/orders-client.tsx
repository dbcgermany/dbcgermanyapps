"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge, ConfirmDialog, Select } from "@dbc/ui";
import { toast } from "sonner";
import { ORDER_STATUS_VALUES } from "@dbc/types";
import { refundOrder } from "@/actions/orders";
import { CsvExportButton } from "@/components/csv-export-button";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";
import { EmptyState } from "@/components/empty-state";

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
          <Select
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
          </Select>
          <Select
            value={currentStatusFilter}
            onChange={(e) => updateFilters(undefined, e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s === "" ? t("allStatus") : t(s)}
              </option>
            ))}
          </Select>
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

      {/* Empty / Mobile / Desktop — all now driven by shared SSOT primitives */}
      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState message={t("noOrders")} />
        </div>
      ) : (
        <>
          <MobileList
            className="mt-6 md:hidden"
            items={orders}
            renderCell={(o) => {
              const statusLabel = t.has(o.status) ? t(o.status) : o.status;
              return {
                id: o.id,
                title: (
                  <span className="flex items-baseline gap-2">
                    <span className="truncate">{o.recipientName}</span>
                    <span className="ml-auto shrink-0 text-sm font-semibold">
                      {o.totalCents === 0
                        ? "—"
                        : `€${(o.totalCents / 100).toFixed(2)}`}
                    </span>
                  </span>
                ),
                meta: (
                  <>
                    <span className="block truncate">{o.recipientEmail}</span>
                    <span className="mt-1 block truncate">{o.eventTitle}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
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
                    </span>
                  </>
                ),
                href: `/${locale}/orders/${o.id}`,
              };
            }}
          />

          <div className="mt-6 hidden md:block">
            <DataTable
              columns={[
                t("event"),
                t("customer"),
                t("status"),
                { label: t("total"), align: "right" },
                t("date"),
                { label: t("actions"), align: "right" },
              ]}
            >
              {orders.map((o) => {
                const canRefund =
                  (o.status === "paid" || o.status === "comped") &&
                  o.status !== ("refunded" as string);
                const statusLabel = t.has(o.status) ? t(o.status) : o.status;
                const acqLabel = t.has(o.acquisitionType)
                  ? t(o.acquisitionType)
                  : o.acquisitionType;

                return (
                  <DataTable.Row key={o.id}>
                    <DataTable.Cell>
                      <p className="font-medium">{o.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {acqLabel}
                        {o.paymentMethod && ` · ${o.paymentMethod}`}
                        {o.sellerName && ` · ${o.sellerName}`}
                      </p>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Link
                        href={`/${locale}/orders/${o.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {o.recipientName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {o.recipientEmail}
                      </p>
                    </DataTable.Cell>
                    <DataTable.Cell>
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
                    </DataTable.Cell>
                    <DataTable.Cell align="right" className="font-medium">
                      {o.totalCents === 0
                        ? "—"
                        : `€${(o.totalCents / 100).toFixed(2)}`}
                    </DataTable.Cell>
                    <DataTable.Cell className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </DataTable.Cell>
                    <DataTable.Cell align="right">
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
                            onConfirm={() =>
                              startTransition(() => runRefund(o.id))
                            }
                          />
                        )}
                      </div>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
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
