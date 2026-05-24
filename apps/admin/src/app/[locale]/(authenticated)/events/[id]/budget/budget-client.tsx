"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge, Button, ConfirmDialog } from "@dbc/ui";
import {
  createExpense,
  updateExpense,
  markExpensePaid,
  markExpenseUnpaid,
  deleteExpense,
  type ExpenseRow,
} from "@/actions/expenses";

const CATEGORY_OPTIONS = [
  "venue",
  "catering",
  "av",
  "marketing",
  "staffing",
  "decoration",
  "logistics",
  "other",
] as const;

type ProviderOption = { id: string; label: string };
type Locale = "en" | "de" | "fr";

type Status = "paid" | "overdue" | "due_soon" | "scheduled";

function statusFor(row: ExpenseRow, todayIso: string): Status {
  if (row.paid_at) return "paid";
  if (!row.due_date) return "scheduled";
  if (row.due_date < todayIso) return "overdue";
  const soonCut = new Date(todayIso);
  soonCut.setUTCDate(soonCut.getUTCDate() + 7);
  if (row.due_date <= soonCut.toISOString().slice(0, 10)) return "due_soon";
  return "scheduled";
}

function badgeVariantFor(status: Status): "success" | "error" | "warning" | "default" {
  switch (status) {
    case "paid": return "success";
    case "overdue": return "error";
    case "due_soon": return "warning";
    default: return "default";
  }
}

function pickDescription(row: ExpenseRow, locale: Locale): string {
  const map = { en: row.description_en, de: row.description_de, fr: row.description_fr };
  return (
    map[locale] ||
    row.description_fr ||
    row.description_en ||
    row.description_de ||
    row.description ||
    ""
  );
}

export function BudgetClient({
  expenses,
  eventId,
  locale,
  l,
  providers,
}: {
  expenses: ExpenseRow[];
  eventId: string;
  locale: string;
  l: Locale;
  providers: ProviderOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const t = useTranslations("admin.events.budget.client");
  const tStatus = useTranslations("admin.events.budget.client.status");

  const todayIso = new Date().toISOString().slice(0, 10);

  function fmtAmount(cents: number, currency: string) {
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency,
    });
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      formData.set("locale", locale);
      const res = await createExpense(eventId, formData);
      if (!("error" in res) || !res.error) {
        setAdding(false);
        router.refresh();
      }
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    startTransition(async () => {
      formData.set("locale", locale);
      const res = await updateExpense(id, eventId, formData);
      if (!("error" in res) || !res.error) {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      await markExpensePaid(id, eventId, locale);
      router.refresh();
    });
  }

  function handleMarkUnpaid(id: string) {
    startTransition(async () => {
      await markExpenseUnpaid(id, eventId, locale);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpense(id, eventId, locale);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t("description")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("category")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("amount")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("vendor")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("due")}</th>
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const status = statusFor(e, todayIso);
                const desc = pickDescription(e, l);
                const isEditing = editingId === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{desc}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{e.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {fmtAmount(e.amount_cents, e.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.provider_contact_id ? (
                          <Link
                            href={`/${locale}/contacts/${e.provider_contact_id}`}
                            className="text-primary hover:underline"
                          >
                            {e.provider_name || e.vendor_name || "—"}
                          </Link>
                        ) : (
                          e.vendor_name || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={badgeVariantFor(status)}>
                            {tStatus(status)}
                          </Badge>
                          <span>{fmtDate(e.paid_at ?? e.due_date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3 text-xs">
                          {e.paid_at ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleMarkUnpaid(e.id)}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                              {t("markUnpaid")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleMarkPaid(e.id)}
                              className="text-success-strong hover:opacity-80 disabled:opacity-50"
                            >
                              {t("markPaid")}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setEditingId(isEditing ? null : e.id)
                            }
                            className="text-primary hover:opacity-80 disabled:opacity-50"
                          >
                            {isEditing ? t("cancel") : t("edit")}
                          </button>
                          <ConfirmDialog
                            trigger={
                              <button
                                type="button"
                                disabled={isPending}
                                className="text-danger hover:opacity-80 disabled:opacity-50"
                              >
                                {t("delete")}
                              </button>
                            }
                            title={t("deleteTitle")}
                            description={`${desc} ${fmtAmount(e.amount_cents, e.currency ?? "EUR")}`}
                            confirmLabel={t("delete")}
                            cancelLabel={t("cancel")}
                            variant="danger"
                            onConfirm={() => handleDelete(e.id)}
                          />
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="px-4 py-4">
                          <ExpenseForm
                            mode="edit"
                            row={e}
                            providers={providers}
                            isPending={isPending}
                            onSubmit={(fd) => handleUpdate(e.id, fd)}
                            onCancel={() => setEditingId(null)}
                            t={t}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add form — collapsible to keep the table the primary focus. */}
      {adding ? (
        <div className="rounded-lg border border-primary/50 bg-muted/30 p-4">
          <ExpenseForm
            mode="create"
            providers={providers}
            isPending={isPending}
            onSubmit={handleCreate}
            onCancel={() => setAdding(false)}
            t={t}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setAdding(true)}
        >
          {t("addNew")}
        </Button>
      )}
    </div>
  );
}

function ExpenseForm({
  mode,
  row,
  providers,
  isPending,
  onSubmit,
  onCancel,
  t,
}: {
  mode: "create" | "edit";
  row?: ExpenseRow;
  providers: ProviderOption[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <form
      action={onSubmit}
      className="space-y-3"
    >
      <div className="grid gap-2 lg:grid-cols-3">
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">EN</span>
          <textarea
            name="description_en"
            defaultValue={row?.description_en ?? ""}
            rows={2}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">DE</span>
          <textarea
            name="description_de"
            defaultValue={row?.description_de ?? ""}
            rows={2}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">FR</span>
          <textarea
            name="description_fr"
            defaultValue={row?.description_fr ?? ""}
            rows={2}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">{t("category")}</span>
          <select
            name="category"
            defaultValue={row?.category ?? "other"}
            className={inputCls}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">{t("amount")}</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={row ? (row.amount_cents / 100).toFixed(2) : ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">{t("due")}</span>
          <input
            name="due_date"
            type="date"
            defaultValue={row?.due_date ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">{t("paidAt")}</span>
          <input
            name="paid_at"
            type="date"
            defaultValue={row?.paid_at ? row.paid_at.slice(0, 10) : ""}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">{t("provider")}</span>
          <select
            name="provider_contact_id"
            defaultValue={row?.provider_contact_id ?? ""}
            className={inputCls}
          >
            <option value="">{t("providerNone")}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">{t("vendor")}</span>
          <input
            name="vendor_name"
            defaultValue={row?.vendor_name ?? ""}
            placeholder={t("vendorPlaceholder")}
            className={inputCls}
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs text-muted-foreground mb-1">
          {t("notes")}
        </span>
        <textarea
          name="notes"
          defaultValue={row?.notes ?? ""}
          rows={2}
          className={inputCls}
        />
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {t("notesHint")}
        </span>
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t("saving")
            : mode === "create"
              ? t("add")
              : t("save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
