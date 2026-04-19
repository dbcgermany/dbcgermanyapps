import { getTranslations } from "next-intl/server";
import { getEventExpenses } from "@/actions/expenses";
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

const T = {
  en: {
    back: "Back to event",
    title: "Budget & Expenses",
    desc: "Track event costs and vendor payments.",
    totalExpenses: "Total expenses",
    lineItems: "Line items",
    revenue: "Revenue",
    netProfit: "Net profit",
    byCategory: "Expenses by category",
    total: "Total",
  },
  de: {
    back: "Zur\u00FCck zum Event",
    title: "Budget & Ausgaben",
    desc: "Veranstaltungskosten und Lieferantenzahlungen verfolgen.",
    totalExpenses: "Gesamtausgaben",
    lineItems: "Positionen",
    revenue: "Einnahmen",
    netProfit: "Nettogewinn",
    byCategory: "Ausgaben nach Kategorie",
    total: "Gesamt",
  },
  fr: {
    back: "Retour \u00E0 l\u2019\u00E9v\u00E9nement",
    title: "Budget & D\u00E9penses",
    desc: "Suivre les co\u00FBts et paiements fournisseurs.",
    totalExpenses: "D\u00E9penses totales",
    lineItems: "\u00C9l\u00E9ments",
    revenue: "Revenus",
    netProfit: "B\u00E9n\u00E9fice net",
    byCategory: "D\u00E9penses par cat\u00E9gorie",
    total: "Total",
  },
} as const;

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
  const t = T[l];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  const [{ expenses, totalCents, count }, financial] = await Promise.all([
    getEventExpenses(eventId),
    getEventFinancialSummary(eventId),
  ]);

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
        title={t.title}
        description={t.desc}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

      {/* Summary cards — 4 KPIs */}
      <div className="mt-6">
        <StatGrid cols={4}>
          <StatCard label={t.revenue} value={fmt(financial.revenueCents)} dense />
          <StatCard
            label={t.totalExpenses}
            value={fmt(totalCents)}
            dense
          />
          <StatCard
            label={t.netProfit}
            value={fmt(financial.profitCents)}
            dense
            sub={financial.profitCents < 0 ? "Operating at a loss" : undefined}
          />
          <StatCard label={t.lineItems} value={String(count)} dense />
        </StatGrid>
      </div>

      {/* Expenses-by-category donut (only if we have expenses) */}
      {categoryData.length > 0 && (
        <div className="mt-6">
          <ChartCard title={t.byCategory} height={280}>
            <DonutChart
              data={categoryData}
              centerLabel={t.total}
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
        />
      </div>
    </div>
  );
}
