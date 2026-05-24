"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import {
  createExpense,
  updateExpense,
  type ExpenseRow,
} from "@/actions/expenses";
import { EXPENSE_CATEGORIES, type BudgetT } from "./copy";

export interface ProviderOption {
  id: string;
  label: string;
}

/**
 * Shared expense form used by both:
 *  - `/events/[id]/budget/new` (create)
 *  - `/events/[id]/budget/[expenseId]` (edit)
 *
 * All 13 fields surface here (trilingual descriptions, amount, category,
 * vendor name + contact, linked provider contact, due/paid dates,
 * receipt URL, notes). The inline create-form on the budget list page
 * only had 5 of these — the detail page is where the full record lives.
 *
 * On success the operator returns to `successPath` (the budget list).
 */
export function ExpenseForm({
  mode,
  expense,
  eventId,
  locale,
  providerOptions,
  successPath,
  t,
}: {
  mode: "create" | "edit";
  expense?: ExpenseRow;
  eventId: string;
  locale: string;
  providerOptions: ReadonlyArray<ProviderOption>;
  successPath: string;
  t: BudgetT;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res =
        mode === "edit" && expense
          ? await updateExpense(expense.id, eventId, formData)
          : await createExpense(eventId, formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? t.save : t.add);
      router.push(successPath);
      router.refresh();
    });
  }

  // amount is stored as cents; the form binds to a plain euro string
  const amountDefault =
    expense?.amount_cents != null
      ? (expense.amount_cents / 100).toFixed(2)
      : "";

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.descriptionEn}>
          <Input
            name="description_en"
            defaultValue={expense?.description_en ?? ""}
          />
        </FormField>
        <FormField label={t.descriptionDe}>
          <Input
            name="description_de"
            defaultValue={expense?.description_de ?? ""}
          />
        </FormField>
        <FormField label={t.descriptionFr}>
          <Input
            name="description_fr"
            defaultValue={expense?.description_fr ?? ""}
          />
        </FormField>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        {t.descriptionHint}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.amount} required>
          <Input
            name="amount"
            type="number"
            step="0.01"
            defaultValue={amountDefault}
            required
          />
        </FormField>
        <FormField label={t.category}>
          <Select name="category" defaultValue={expense?.category ?? "other"}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t.categories[c] ?? c}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.dueDate}>
          <Input
            name="due_date"
            type="date"
            defaultValue={expense?.due_date ?? ""}
          />
        </FormField>
        <FormField label={t.paidDate}>
          <Input
            name="paid_at"
            type="date"
            defaultValue={expense?.paid_at ? expense.paid_at.slice(0, 10) : ""}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.vendor}>
          <Input
            name="vendor_name"
            defaultValue={expense?.vendor_name ?? ""}
          />
        </FormField>
        <FormField label={t.vendorContact}>
          <Input
            name="vendor_contact"
            defaultValue={expense?.vendor_contact ?? ""}
          />
        </FormField>
      </div>

      <FormField label={t.provider} hint={t.providerHint}>
        <Select
          name="provider_contact_id"
          defaultValue={expense?.provider_contact_id ?? ""}
        >
          <option value="">{t.providerNone}</option>
          {providerOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={t.receipt}>
        <Input
          name="receipt_url"
          type="url"
          defaultValue={expense?.receipt_url ?? ""}
        />
      </FormField>

      <FormField label={t.notes}>
        <Textarea
          name="notes"
          defaultValue={expense?.notes ?? ""}
          rows={3}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === "edit"
              ? t.saving
              : t.adding
            : mode === "edit"
              ? t.save
              : t.add}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(successPath)}
        >
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
