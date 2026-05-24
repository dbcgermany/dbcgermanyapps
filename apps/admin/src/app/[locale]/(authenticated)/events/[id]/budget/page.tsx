import { getTranslations } from "next-intl/server";
import {
  getEventExpenses,
  getProviderContactOptions,
} from "@/actions/expenses";
import { getEventFinancialSummary } from "@/actions/reports";
import { BudgetClient } from "./budget-client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import {
  ChartCard,
  DonutChart,
  ChartLegend,
  CHART_COLORS,
} from "@/components/charts";
import { captureServerError } from "@/lib/observe";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = await getTranslations({ locale, namespace: "admin.events.budget" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  // Each fetch is independently caught so a single failure can't blow up the
  // whole page. The actual error reaches Sentry via captureServerError, and
  // the page renders with safe defaults for the failing slice. Without this
  // wrap the bare Promise.all rethrows and Next.js shows the masked
  // "Server Components render" error wall.
  const expensesResult = await getEventExpenses(eventId).catch((err) => {
    captureServerError(err, {
      scope: "budget/page:getEventExpenses",
      data: { event_id: eventId },
    });
    return {
      expenses: [] as Awaited<
        ReturnType<typeof getEventExpenses>
      >["expenses"],
      totalCents: 0,
      paidCents: 0,
      unpaidCents: 0,
      overdueCents: 0,
      count: 0,
    };
  });
  const { expenses, totalCents, paidCents, unpaidCents, overdueCents, count } =
    expensesResult;
  const financial = await getEventFinancialSummary(eventId).catch((err) => {
    captureServerError(err, {
      scope: "budget/page:getEventFinancialSummary",
      data: { event_id: eventId },
    });
    return {
      eventId,
      eventTitle: "Event",
      revenueCents: 0,
      expensesCents: 0,
      profitCents: 0,
      taxEstimateCents: 0,
      allocationsCount: 0,
    };
  });
  const providers = await getProviderContactOptions().catch((err) => {
    captureServerError(err, { scope: "budget/page:getProviderContactOptions" });
    return [] as Awaited<ReturnType<typeof getProviderContactOptions>>;
  });

  const fmt = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  // Aggregate expenses by category for the donut
  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount_cents);
  }
  const categoryData = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value / 100,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("desc")}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        cta={
          <a
            href={`/api/budget/${eventId}?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {t("exportPdf")}
          </a>
        }
      />

      {/* Top KPI row — 4 cards: budget total / paid / unpaid / overdue */}
      <div className="mt-6">
        <StatGrid cols={4}>
          <StatCard
            label={t("totalExpenses")}
            value={fmt(totalCents)}
            sub={t("lineItemsSub", { n: count })}
            dense
          />
          <StatCard label={t("paid")} value={fmt(paidCents)} dense />
          <StatCard label={t("unpaid")} value={fmt(unpaidCents)} dense />
          <StatCard
            label={t("overdue")}
            value={fmt(overdueCents)}
            dense
            sub={overdueCents > 0 ? t("overdueSub") : undefined}
          />
        </StatGrid>
      </div>

      {/* P&L row — revenue / expenses / net profit / allocations sidecar */}
      <div className="mt-4">
        <StatGrid cols={4}>
          <StatCard label={t("revenue")} value={fmt(financial.revenueCents)} dense />
          <StatCard
            label={t("netProfit")}
            value={fmt(financial.profitCents)}
            dense
            sub={financial.profitCents < 0 ? t("loss") : undefined}
          />
          <StatCard
            label={t("allocations")}
            value={String(financial.allocationsCount)}
            sub={t("allocationsSub")}
            dense
          />
          <StatCard label={t("lineItems")} value={String(count)} dense />
        </StatGrid>
      </div>

      {/* Expenses-by-category donut (only if we have expenses) */}
      {categoryData.length > 0 && (
        <div className="mt-6">
          <ChartCard title={t("byCategory")} height={280}>
            <DonutChart
              data={categoryData}
              centerLabel={t("total")}
              centerValue={fmt(totalCents)}
              valueFormatter={(v) =>
                `\u20AC${Math.round(v).toLocaleString()}`
              }
            />
          </ChartCard>
          <ChartLegend
            items={categoryData.map((c) => ({
              name: c.name,
              color: c.color,
              value: `\u20AC${c.value.toLocaleString(locale, { maximumFractionDigits: 0 })}`,
            }))}
          />
        </div>
      )}

      {/* Expense table + add form */}
      <div className="mt-8">
        <BudgetClient
          expenses={expenses}
          eventId={eventId}
          locale={locale}
          l={l}
          providers={providers}
        />
      </div>
    </div>
  );
}
