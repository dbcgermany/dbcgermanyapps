import Link from "next/link";
import { getEventExpenses } from "@/actions/expenses";
import { BudgetClient } from "./budget-client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

const T = {
  en: {
    back: "Back to event",
    title: "Budget & Expenses",
    desc: "Track event costs and vendor payments.",
    totalExpenses: "Total expenses",
    lineItems: "Line items",
    addTitle: "Add Expense",
  },
  de: {
    back: "Zur\u00FCck zum Event",
    title: "Budget & Ausgaben",
    desc: "Veranstaltungskosten und Lieferantenzahlungen verfolgen.",
    totalExpenses: "Gesamtausgaben",
    lineItems: "Positionen",
    addTitle: "Ausgabe hinzuf\u00FCgen",
  },
  fr: {
    back: "Retour \u00E0 l\u2019\u00E9v\u00E9nement",
    title: "Budget & D\u00E9penses",
    desc: "Suivre les co\u00FBts et paiements fournisseurs.",
    totalExpenses: "D\u00E9penses totales",
    lineItems: "\u00C9l\u00E9ments",
    addTitle: "Ajouter une d\u00E9pense",
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

  const { expenses, totalCents, count } = await getEventExpenses(eventId);

  const formattedTotal = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(totalCents / 100);

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; {t.back}
        </Link>
        <PageHeader title={t.title} description={t.desc} className="mt-2" />
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t.totalExpenses} value={formattedTotal} dense />
        <StatCard label={t.lineItems} value={String(count)} dense />
      </div>

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
