import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getEventExpenses } from "@/actions/expenses";
import { PageHeader } from "@/components/page-header";
import { PdfButton } from "@/components/pdf-button";
import { AddButton } from "@/components/add-button";
import { BudgetClient } from "./budget-client";
import { pickBudgetT } from "./copy";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const pt = pickBudgetT(locale);
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  // notFound() guard for missing/deleted event IDs (same pattern as checklist).
  try {
    await getEvent(eventId);
  } catch {
    notFound();
  }

  const { expenses, totalCents, paidCents, unpaidCents, overdueCents, count } =
    await getEventExpenses(eventId);

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });

  const description =
    `${count} ${pt.lineItems} · ${pt.total} ${fmt(totalCents)}` +
    ` · ${fmt(paidCents)} ${pt.paid} · ${fmt(unpaidCents)} ${pt.unpaid}` +
    (overdueCents > 0 ? ` · ${fmt(overdueCents)} ${pt.overdue}` : "");

  return (
    <div>
      <PageHeader
        title={pt.listTitle}
        description={description}
        back={{
          href: `/${locale}/events/${eventId}`,
          label: tBack("event"),
        }}
        cta={
          <div className="flex flex-wrap items-center gap-2">
            <AddButton
              href={`/${locale}/events/${eventId}/budget/new`}
              label={pt.addExpense}
            />
            <PdfButton
              href={`/api/budget/${eventId}?locale=${locale}`}
              label={pt.exportPdf}
            />
          </div>
        }
      />

      <div className="mt-8">
        <BudgetClient eventId={eventId} locale={locale} expenses={expenses} />
      </div>
    </div>
  );
}
