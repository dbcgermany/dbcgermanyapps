import { getProviderContactOptions } from "@/actions/expenses";
import { getRunsheetPickerOptionsForEvent } from "@/actions/checklist";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "../expense-form";
import { pickBudgetT } from "../copy";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = pickBudgetT(locale);
  const [providers, runsheetOptions] = await Promise.all([
    getProviderContactOptions(),
    getRunsheetPickerOptionsForEvent(eventId),
  ]);
  const budgetListPath = `/${locale}/events/${eventId}/budget`;

  return (
    <div>
      <PageHeader
        back={{ href: budgetListPath, label: t.backToBudget }}
        title={t.newExpenseTitle}
      />

      <div className="mt-8 max-w-3xl">
        <ExpenseForm
          mode="create"
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
