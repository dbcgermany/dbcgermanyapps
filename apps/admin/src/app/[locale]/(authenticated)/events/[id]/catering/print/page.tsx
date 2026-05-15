import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getCateringCounts } from "@/actions/catering";
import { PrintControls } from "./print-controls";
import type { CateringCategory } from "@/lib/catering-types";

/**
 * Counts-only kitchen report. Renders in a stripped-down print layout —
 * no nav, no sidebar — so the operator can use the browser's "Print → Save
 * as PDF" to produce the PDF the kitchen needs. No attendee names by design;
 * only dish counts + dietary tally totals.
 *
 * Routes through the existing auth gate by sitting inside the
 * (authenticated) segment, so it inherits requireRole / RLS via the
 * server action.
 */
export default async function CateringPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [event, counts, t] = await Promise.all([
    getEvent(id),
    getCateringCounts(id),
    getTranslations({ locale, namespace: "admin.catering.print" }),
  ]);

  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string | undefined) ||
    event.title_en;
  const eventDate = event.starts_at
    ? new Date(event.starts_at).toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  function nameFor(item: {
    name_en: string;
    name_de: string;
    name_fr: string;
  }): string {
    if (locale === "de") return item.name_de || item.name_en;
    if (locale === "fr") return item.name_fr || item.name_en;
    return item.name_en;
  }

  // Categories in display order — only render the ones that have items.
  const CATEGORY_ORDER: CateringCategory[] = [
    "starter",
    "main",
    "dessert",
    "drink_non_alcoholic",
    "drink_alcoholic",
    "snack",
  ];
  const byCategory = new Map<CateringCategory, typeof counts.items>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
  for (const item of counts.items) {
    byCategory.get(item.category)?.push(item);
  }

  // Dietary roll-up for the kitchen summary card.
  const totals = counts.items.reduce(
    (acc, i) => {
      acc.total += i.count;
      if (i.is_vegan) acc.vegan += i.count;
      else if (i.is_vegetarian) acc.vegetarian += i.count;
      return acc;
    },
    { total: 0, vegan: 0, vegetarian: 0 }
  );

  return (
    <main className="print-report mx-auto max-w-3xl px-6 py-10 text-foreground">
      <PrintControls printLabel={t("printButton")} />

      <header className="border-b border-border pb-4">
        <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>{eventTitle}</strong>
          {eventDate ? ` · ${eventDate}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("generatedAt", {
            ts: new Date().toLocaleString(locale),
          })}
        </p>
      </header>

      <section className="mt-6 rounded-lg border border-border bg-muted/10 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("summary")}
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <span className="text-muted-foreground">{t("attendees")}: </span>
            <span className="font-semibold">{counts.totalAttendees}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("totalPicks")}: </span>
            <span className="font-semibold">{totals.total}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("vegetarian")}: </span>
            <span className="font-semibold">{totals.vegetarian}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("vegan")}: </span>
            <span className="font-semibold">{totals.vegan}</span>
          </div>
        </div>
      </section>

      {CATEGORY_ORDER.map((cat) => {
        const items = byCategory.get(cat) ?? [];
        if (items.length === 0) return null;
        const sectionTotal = items.reduce((s, i) => s + i.count, 0);
        return (
          <section key={cat} className="mt-6">
            <h2 className="border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`categories.${cat}`)}{" "}
              <span className="text-[11px] normal-case text-muted-foreground/70">
                · {t("sectionTotal", { n: sectionTotal })}
              </span>
            </h2>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="py-1 text-left font-medium">{t("dish")}</th>
                  <th className="py-1 text-left font-medium">{t("dietary")}</th>
                  <th className="py-1 text-left font-medium">
                    {t("allergens")}
                  </th>
                  <th className="py-1 text-right font-medium">{t("count")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.item_id} className="border-t border-border/60">
                    <td className="py-1.5 pr-2">{nameFor(item)}</td>
                    <td className="py-1.5 pr-2 text-xs text-muted-foreground">
                      {[
                        item.is_vegan && "vegan",
                        item.is_vegetarian && !item.is_vegan && "veg",
                        item.is_halal && "halal",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="py-1.5 pr-2 text-xs text-muted-foreground">
                      {item.allergens.length > 0
                        ? item.allergens.join(", ")
                        : "—"}
                    </td>
                    <td className="py-1.5 text-right font-mono font-semibold">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <footer className="mt-10 border-t border-border pt-4 text-[11px] text-muted-foreground">
        {t("footer")}
      </footer>

      <style>{`
        @media print {
          /* Hide everything outside the report — nav, sidebar, etc. */
          body > *:not(main) { display: none !important; }
          .print-report { padding: 0 !important; max-width: none !important; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </main>
  );
}
