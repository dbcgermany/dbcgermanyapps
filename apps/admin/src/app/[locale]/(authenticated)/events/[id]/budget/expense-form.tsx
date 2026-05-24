"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@dbc/ui";
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
        <Field
          label={t.descriptionEn}
          name="description_en"
          defaultValue={expense?.description_en ?? ""}
        />
        <Field
          label={t.descriptionDe}
          name="description_de"
          defaultValue={expense?.description_de ?? ""}
        />
        <Field
          label={t.descriptionFr}
          name="description_fr"
          defaultValue={expense?.description_fr ?? ""}
        />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        {t.descriptionHint}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.amount}
          name="amount"
          type="number"
          step="0.01"
          defaultValue={amountDefault}
          required
        />
        <SelectField
          label={t.category}
          name="category"
          defaultValue={expense?.category ?? "other"}
          options={EXPENSE_CATEGORIES.map((c) => ({
            value: c,
            label: t.categories[c] ?? c,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.dueDate}
          name="due_date"
          type="date"
          defaultValue={expense?.due_date ?? ""}
        />
        <Field
          label={t.paidDate}
          name="paid_at"
          type="date"
          defaultValue={expense?.paid_at ? expense.paid_at.slice(0, 10) : ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.vendor}
          name="vendor_name"
          defaultValue={expense?.vendor_name ?? ""}
        />
        <Field
          label={t.vendorContact}
          name="vendor_contact"
          defaultValue={expense?.vendor_contact ?? ""}
        />
      </div>

      <div>
        <SelectField
          label={t.provider}
          name="provider_contact_id"
          defaultValue={expense?.provider_contact_id ?? ""}
          options={[
            { value: "", label: t.providerNone },
            ...providerOptions.map((o) => ({ value: o.id, label: o.label })),
          ]}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t.providerHint}</p>
      </div>

      <Field
        label={t.receipt}
        name="receipt_url"
        type="url"
        defaultValue={expense?.receipt_url ?? ""}
      />

      <TextareaField
        label={t.notes}
        name="notes"
        defaultValue={expense?.notes ?? ""}
      />

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

/* tiny field helpers — Phase 5 will swap these for FormField across every admin form */

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
}: {
  label: ReactNode;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: ReactNode;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
}: {
  label: ReactNode;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
