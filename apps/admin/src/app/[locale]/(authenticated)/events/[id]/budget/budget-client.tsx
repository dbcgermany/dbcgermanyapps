"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, Button } from "@dbc/ui";
import {
  markExpensePaid,
  markExpenseUnpaid,
  deleteExpense,
  type ExpenseRow,
} from "@/actions/expenses";
import { InlineEditRow } from "@/components/inline-edit-row";
import { EditableList } from "@/components/editable-list";
import { DeleteButton } from "@/components/delete-button";
import { pickBudgetT, type BudgetT } from "./copy";

/**
 * Read-only list of expenses. Each row's description is a Link to the
 * dedicated detail page where the full 13-field edit form lives.
 * Per-row Mark Paid/Unpaid + Delete stay on the row for one-click ops.
 * Creation lives at `/budget/new`, reached via the AddButton in the
 * page header (added in page.tsx, not here).
 *
 * Previous inline create form was removed in Phase 8 — one form per
 * resource (the detail/new pages) avoids the two-form drift risk and
 * matches the sponsors + every other global resource pattern.
 */
export function BudgetClient({
  eventId,
  locale,
  expenses,
}: {
  eventId: string;
  locale: string;
  expenses: ExpenseRow[];
}) {
  const t = pickBudgetT(locale);

  return (
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
        <Link
          href={`/${locale}/events/${eventId}/budget/${expense.id}`}
          className="flex items-baseline gap-2 hover:text-primary"
        >
          <span>{description}</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {fmt(expense.amount_cents)}
          </span>
        </Link>
      }
      badges={
        <>
          <Badge variant="default">
            {t.categories[expense.category] ?? expense.category}
          </Badge>
          {isPaid ? (
            <Badge variant="success">{t.paidBadge}</Badge>
          ) : isOverdue ? (
            <Badge variant="warning">{t.overdue}</Badge>
          ) : (
            <Badge variant="default">{t.unpaidBadge}</Badge>
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
          {isPaid && expense.paid_at && (
            <span>
              {t.paidBadge}:{" "}
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
