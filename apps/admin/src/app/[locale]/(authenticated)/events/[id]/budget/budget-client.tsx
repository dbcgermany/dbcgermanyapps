"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, Button } from "@dbc/ui";
import {
  createExpense,
  markExpensePaid,
  markExpenseUnpaid,
  deleteExpense,
  type ExpenseRow,
} from "@/actions/expenses";
import { InlineEditRow } from "@/components/inline-edit-row";
import { EditableList } from "@/components/editable-list";
import { DeleteButton } from "@/components/delete-button";

const BC_T = {
  en: {
    empty: "No expenses recorded yet. Add your first one below.",
    addExpense: "+ Add expense",
    newExpense: "New expense",
    description: "Description",
    amount: "Amount (EUR)",
    category: "Category",
    dueDate: "Due date",
    vendor: "Vendor",
    add: "Add",
    cancel: "Cancel",
    saving: "Saving…",
    markPaid: "Mark paid",
    markUnpaid: "Mark unpaid",
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    deleteConfirm: "Delete this expense?",
    delete: "Delete",
    deleteToast: "Expense deleted",
    paidToast: "Marked paid",
    unpaidToast: "Marked unpaid",
    addToast: "Expense added",
    categories: {
      venue: "Venue",
      catering: "Catering",
      av: "A/V",
      production: "Production",
      marketing: "Marketing",
      travel: "Travel",
      speakers: "Speakers",
      staff: "Staff",
      decor: "Decor",
      printing: "Printing",
      other: "Other",
    } as Record<string, string>,
  },
  de: {
    empty: "Noch keine Ausgaben erfasst. Fügen Sie unten Ihre erste hinzu.",
    addExpense: "+ Ausgabe hinzufügen",
    newExpense: "Neue Ausgabe",
    description: "Beschreibung",
    amount: "Betrag (EUR)",
    category: "Kategorie",
    dueDate: "Fällig am",
    vendor: "Lieferant",
    add: "Hinzufügen",
    cancel: "Abbrechen",
    saving: "Wird gespeichert…",
    markPaid: "Als bezahlt markieren",
    markUnpaid: "Als offen markieren",
    paid: "Bezahlt",
    unpaid: "Offen",
    overdue: "Überfällig",
    deleteConfirm: "Diese Ausgabe löschen?",
    delete: "Löschen",
    deleteToast: "Ausgabe gelöscht",
    paidToast: "Als bezahlt markiert",
    unpaidToast: "Als offen markiert",
    addToast: "Ausgabe hinzugefügt",
    categories: {
      venue: "Veranstaltungsort",
      catering: "Catering",
      av: "Technik",
      production: "Produktion",
      marketing: "Marketing",
      travel: "Reise",
      speakers: "Sprecher",
      staff: "Personal",
      decor: "Dekoration",
      printing: "Druck",
      other: "Sonstiges",
    } as Record<string, string>,
  },
  fr: {
    empty: "Aucune dépense enregistrée. Ajoutez la première ci-dessous.",
    addExpense: "+ Ajouter une dépense",
    newExpense: "Nouvelle dépense",
    description: "Description",
    amount: "Montant (EUR)",
    category: "Catégorie",
    dueDate: "Échéance",
    vendor: "Fournisseur",
    add: "Ajouter",
    cancel: "Annuler",
    saving: "Enregistrement…",
    markPaid: "Marquer payé",
    markUnpaid: "Marquer non payé",
    paid: "Payé",
    unpaid: "Non payé",
    overdue: "En retard",
    deleteConfirm: "Supprimer cette dépense ?",
    delete: "Supprimer",
    deleteToast: "Dépense supprimée",
    paidToast: "Marquée payée",
    unpaidToast: "Marquée non payée",
    addToast: "Dépense ajoutée",
    categories: {
      venue: "Lieu",
      catering: "Restauration",
      av: "A/V",
      production: "Production",
      marketing: "Marketing",
      travel: "Voyage",
      speakers: "Intervenants",
      staff: "Personnel",
      decor: "Décoration",
      printing: "Impression",
      other: "Autre",
    } as Record<string, string>,
  },
} as const;

type BudgetT = (typeof BC_T)[keyof typeof BC_T];

const CATEGORIES = [
  "venue",
  "catering",
  "av",
  "production",
  "marketing",
  "travel",
  "speakers",
  "staff",
  "decor",
  "printing",
  "other",
] as const;

export function BudgetClient({
  eventId,
  locale,
  expenses,
}: {
  eventId: string;
  locale: string;
  expenses: ExpenseRow[];
}) {
  const t = BC_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof BC_T];

  return (
    <div className="space-y-8">
      <EditableList isEmpty={expenses.length === 0} emptyMessage={t.empty}>
        {expenses.map((e) => (
          <ExpenseRowCard
            key={e.id}
            expense={e}
            eventId={eventId}
            locale={locale}
            t={t}
          />
        ))}
      </EditableList>

      <CreateExpensePanel eventId={eventId} locale={locale} t={t} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ExpenseRowCard({
  expense,
  eventId,
  locale,
  t,
}: {
  expense: ExpenseRow;
  eventId: string;
  locale: string;
  t: BudgetT;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const description =
    (locale === "fr"
      ? expense.description_fr
      : locale === "de"
        ? expense.description_de
        : expense.description_en) ||
    expense.description ||
    "—";

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency: expense.currency || "EUR",
      maximumFractionDigits: 0,
    });

  const today = new Date().toISOString().slice(0, 10);
  const isPaid = Boolean(expense.paid_at);
  const isOverdue =
    !isPaid && expense.due_date != null && expense.due_date < today;

  function toggle() {
    startTransition(async () => {
      const res = isPaid
        ? await markExpenseUnpaid(expense.id, eventId, locale)
        : await markExpensePaid(expense.id, eventId, locale);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(isPaid ? t.unpaidToast : t.paidToast);
      router.refresh();
    });
  }

  return (
    <InlineEditRow
      title={
        <span className="flex items-baseline gap-2">
          <span>{description}</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {fmt(expense.amount_cents)}
          </span>
        </span>
      }
      badges={
        <>
          <Badge variant="default">
            {t.categories[expense.category] ?? expense.category}
          </Badge>
          {isPaid ? (
            <Badge variant="success">{t.paid}</Badge>
          ) : isOverdue ? (
            <Badge variant="warning">{t.overdue}</Badge>
          ) : (
            <Badge variant="default">{t.unpaid}</Badge>
          )}
        </>
      }
      meta={
        <span className="flex flex-wrap gap-3">
          {expense.due_date && (
            <span>
              {t.dueDate}:{" "}
              {new Date(expense.due_date).toLocaleDateString(locale)}
            </span>
          )}
          {expense.vendor_name && (
            <span>
              {t.vendor}: {expense.vendor_name}
            </span>
          )}
          {expense.provider_name && <span>{expense.provider_name}</span>}
          {isPaid && expense.paid_at && (
            <span>
              {t.paid}:{" "}
              {new Date(expense.paid_at).toLocaleDateString(locale)}
            </span>
          )}
        </span>
      }
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggle}
          disabled={isPending}
        >
          {isPaid ? t.markUnpaid : t.markPaid}
        </Button>
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteExpense(expense.id, eventId, locale)}
          confirmTitle={t.deleteConfirm}
          confirmDescription={description}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deleteToast}
          compact
        />
      }
    />
  );
}

/* -------------------------------------------------------------------------- */

function CreateExpensePanel({
  eventId,
  locale,
  t,
}: {
  eventId: string;
  locale: string;
  t: BudgetT;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        {t.addExpense}
      </Button>
    );
  }
  return (
    <div className="rounded-lg border border-primary/40 bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">{t.newExpense}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          {t.cancel}
        </Button>
      </div>
      <CreateExpenseForm
        eventId={eventId}
        locale={locale}
        t={t}
        onDone={() => setOpen(false)}
      />
    </div>
  );
}

function CreateExpenseForm({
  eventId,
  locale,
  t,
  onDone,
}: {
  eventId: string;
  locale: string;
  t: BudgetT;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await createExpense(eventId, formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t.addToast);
      onDone();
      router.refresh();
    });
  }

  // Description field name flips by locale so a German operator types the
  // German description first — the action mirrors it into the legacy column.
  const primaryName =
    locale === "fr"
      ? "description_fr"
      : locale === "de"
        ? "description_de"
        : "description_en";

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t.description}
          name={primaryName}
          required
          placeholder="e.g. Venue deposit"
        />
        <Field
          label={t.amount}
          name="amount"
          type="number"
          step="0.01"
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={t.category}
          name="category"
          defaultValue="other"
          options={CATEGORIES.map((c) => ({
            value: c,
            label: t.categories[c] ?? c,
          }))}
        />
        <Field label={t.dueDate} name="due_date" type="date" />
      </div>
      <Field label={t.vendor} name="vendor_name" />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.add}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

/* tiny field helpers — Phase 5 will swap these for FormField everywhere */

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
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
        placeholder={placeholder}
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
  label: string;
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
