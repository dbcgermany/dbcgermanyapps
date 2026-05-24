import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getEventExpenses } from "@/actions/expenses";
import { PageHeader } from "@/components/page-header";
import { BudgetClient } from "./budget-client";

// Mirrors the proven shape used by checklist/page.tsx: inline strings for the
// page-level chrome, single getTranslations call for the back-button label,
// minimal Promise chain. Charts, KPI rows, provider picker, financial
// summary all moved down into BudgetClient (or a follow-up) so a failure in
// any of them can't take down the whole page server-render.

const PAGE_T = {
  en: {
    title: "Budget & Expenses",
    desc: "Track event costs and vendor payments.",
    total: "Total",
    paid: "paid",
    unpaid: "unpaid",
    overdue: "overdue",
    lineItems: "line items",
    exportPdf: "Export PDF",
  },
  de: {
    title: "Budget & Ausgaben",
    desc: "Veranstaltungskosten und Lieferantenzahlungen verfolgen.",
    total: "Gesamt",
    paid: "bezahlt",
    unpaid: "offen",
    overdue: "überfällig",
    lineItems: "Positionen",
    exportPdf: "PDF exportieren",
  },
  fr: {
    title: "Budget & Dépenses",
    desc: "Suivre les coûts et paiements fournisseurs.",
    total: "Total",
    paid: "payé",
    unpaid: "à payer",
    overdue: "en retard",
    lineItems: "lignes",
    exportPdf: "Exporter en PDF",
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
  const pt = PAGE_T[l];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  // Same notFound() pattern as checklist/page.tsx — guards against
  // missing/deleted event IDs.
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

  return (
    <div>
      <PageHeader
        title={pt.title}
        description={`${count} ${pt.lineItems} · ${pt.total} ${fmt(totalCents)} · ${fmt(paidCents)} ${pt.paid} · ${fmt(unpaidCents)} ${pt.unpaid}${overdueCents > 0 ? ` · ${fmt(overdueCents)} ${pt.overdue}` : ""}`}
        back={{
          href: `/${locale}/events/${eventId}`,
          label: tBack("event"),
        }}
        cta={
          <a
            href={`/api/budget/${eventId}?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {pt.exportPdf}
          </a>
        }
      />

      <div className="mt-8">
        <BudgetClient
          expenses={expenses}
          eventId={eventId}
          locale={locale}
          l={l}
          providers={[]}
        />
      </div>
    </div>
  );
}
