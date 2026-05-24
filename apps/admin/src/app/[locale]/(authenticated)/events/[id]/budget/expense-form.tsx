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

  // Primary name = active locale's description. Required. Other two
  // locales drop into the "Translations" section below as optional.
  const primaryDescField =
    locale === "fr"
      ? { name: "description_fr", value: expense?.description_fr ?? "" }
      : locale === "de"
        ? { name: "description_de", value: expense?.description_de ?? "" }
        : { name: "description_en", value: expense?.description_en ?? "" };
  const secondaryDescFields =
    locale === "fr"
      ? ([
          { name: "description_en", value: expense?.description_en ?? "", label: t.nameEn },
          { name: "description_de", value: expense?.description_de ?? "", label: t.nameDe },
        ] as const)
      : locale === "de"
        ? ([
            { name: "description_en", value: expense?.description_en ?? "", label: t.nameEn },
            { name: "description_fr", value: expense?.description_fr ?? "", label: t.nameFr },
          ] as const)
        : ([
            { name: "description_de", value: expense?.description_de ?? "", label: t.nameDe },
            { name: "description_fr", value: expense?.description_fr ?? "", label: t.nameFr },
          ] as const);

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Primary name — active locale, required. Matches the single-name
          pattern used by sponsors (company_name), team members, news posts,
          etc. so every "add / edit" page across the admin has the same
          "type the name here" affordance at the top. */}
      <FormField label={t.nameLabel} required hint={t.nameHint}>
        <Input
          name={primaryDescField.name}
          defaultValue={primaryDescField.value}
          required
        />
      </FormField>

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

      {/* Optional translations — pre-fill names in the other two locales
          so a German operator reading a French PDF (or vice versa) sees
          the right wording. Stays at the bottom because it's optional and
          the primary name above is the field every operator must fill. */}
      <details className="rounded-md border border-border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t.translationsTitle}
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.translationsHint}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {secondaryDescFields.map((f) => (
            <FormField key={f.name} label={f.label}>
              <Input name={f.name} defaultValue={f.value} />
            </FormField>
          ))}
        </div>
      </details>

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
