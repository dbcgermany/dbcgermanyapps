import { notFound } from "next/navigation";
import { Badge } from "@dbc/ui";
import {
  getExpense,
  deleteExpense,
  getProviderContactOptions,
} from "@/actions/expenses";
import { getRunsheetPickerOptionsForEvent } from "@/actions/checklist";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { ExpenseForm } from "../expense-form";
import { pickBudgetT } from "../copy";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; expenseId: string }>;
}) {
  const { locale, id: eventId, expenseId } = await params;
  const t = pickBudgetT(locale);

  const [expense, providers, runsheetOptions] = await Promise.all([
    getExpense(expenseId),
    getProviderContactOptions(),
    getRunsheetPickerOptionsForEvent(eventId),
  ]);
  if (!expense) notFound();

  const budgetListPath = `/${locale}/events/${eventId}/budget`;
  const today = new Date().toISOString().slice(0, 10);
  const isPaid = Boolean(expense.paid_at);
  const isOverdue =
    !isPaid && expense.due_date != null && expense.due_date < today;

  const titleDescription =
    (locale === "fr"
      ? expense.description_fr
      : locale === "de"
        ? expense.description_de
        : expense.description_en) ||
    expense.description ||
    "—";

  return (
    <div>
      <PageHeader
        back={{ href: budgetListPath, label: t.backToBudget }}
        title={titleDescription}
        description={t.editExpenseTitle}
        cta={
          <div className="flex flex-wrap items-center gap-2">
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
            <DeleteButton
              action={async () => {
                "use server";
                return deleteExpense(expense.id, eventId, locale);
              }}
              confirmTitle={t.deleteConfirm}
              confirmDescription={titleDescription}
              confirmLabel={t.delete}
              cancelLabel={t.cancel}
              label={t.delete}
              successToast={t.deleteToast}
            />
          </div>
        }
      />

      <div className="mt-8 max-w-3xl">
        <ExpenseForm
          mode="edit"
          expense={expense}
          eventId={eventId}
          locale={locale}
          providerOptions={providers}
          runsheetOptions={runsheetOptions}
          successPath={budgetListPath}
          t={t}
        />
      </div>
    </div>
  );
}
