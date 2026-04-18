"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import { createExpense, deleteExpense } from "@/actions/expenses";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount_cents: number;
  currency: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  paid_at: string | null;
  created_at: string;
}

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

const T = {
  en: {
    description: "Description",
    category: "Category",
    amount: "Amount (\u20AC)",
    vendor: "Vendor",
    vendorContact: "Vendor contact",
    paidAt: "Paid on",
    add: "Add expense",
    adding: "Adding...",
    delete: "Delete",
    noExpenses: "No expenses recorded yet.",
  },
  de: {
    description: "Beschreibung",
    category: "Kategorie",
    amount: "Betrag (\u20AC)",
    vendor: "Lieferant",
    vendorContact: "Kontakt",
    paidAt: "Bezahlt am",
    add: "Ausgabe hinzuf\u00FCgen",
    adding: "Wird hinzugef\u00FCgt...",
    delete: "L\u00F6schen",
    noExpenses: "Noch keine Ausgaben erfasst.",
  },
  fr: {
    description: "Description",
    category: "Cat\u00E9gorie",
    amount: "Montant (\u20AC)",
    vendor: "Fournisseur",
    vendorContact: "Contact",
    paidAt: "Pay\u00E9 le",
    add: "Ajouter",
    adding: "Ajout...",
    delete: "Supprimer",
    noExpenses: "Aucune d\u00E9pense enregistr\u00E9e.",
  },
} as const;

export function BudgetClient({
  expenses,
  eventId,
  locale,
  l,
}: {
  expenses: Expense[];
  eventId: string;
  locale: string;
  l: "en" | "de" | "fr";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = T[l];

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      formData.set("locale", locale);
      await createExpense(eventId, formData);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    startTransition(async () => {
      await deleteExpense(id, eventId, locale);
      router.refresh();
    });
  }

  function fmtAmount(cents: number, currency: string) {
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency,
    });
  }

  return (
    <div className="space-y-6">
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noExpenses}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.description}</th>
                <th className="px-4 py-3 text-left font-medium">{t.category}</th>
                <th className="px-4 py-3 text-right font-medium">{t.amount}</th>
                <th className="px-4 py-3 text-left font-medium">{t.vendor}</th>
                <th className="px-4 py-3 text-left font-medium">{t.paidAt}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{e.description}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{e.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {fmtAmount(e.amount_cents, e.currency)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.vendor_name || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.paid_at
                      ? new Date(e.paid_at).toLocaleDateString(locale)
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {t.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add form */}
      <form
        action={handleAdd}
        className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="description"
            placeholder={t.description}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            name="category"
            defaultValue="other"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder={t.amount}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            name="vendor_name"
            placeholder={t.vendor}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            name="paid_at"
            type="date"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t.adding : t.add}
        </button>
      </form>
    </div>
  );
}
