"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { AdminModule } from "@dbc/types";
import { useCan } from "@/lib/use-can";

// Simple tab strip. Each tab is a real link with ?tab= so the view is
// deep-linkable and back/forward works naturally. Filters on a tab travel
// via their own query params (finance uses ?from, ?to, ?channel, ?event;
// general uses the legacy set) so switching tabs clears only the tab —
// not the per-tab filter state.

type TabKey =
  | "finance"
  | "marketing"
  | "operations"
  | "visitors"
  | "hr"
  | "it"
  | "general";

// Each tab maps to a module in the canonical PERMISSIONS matrix. Manager
// sees marketing/operations/visitors; admin sees everything (finance/hr/it).
// "general" is the legacy combined view — gated to admin since it surfaces
// finance data.
const TAB_MODULE: Record<TabKey, AdminModule> = {
  finance: "reports.finance",
  marketing: "reports.marketing",
  operations: "reports.ops",
  visitors: "reports.visitors",
  hr: "reports.hr",
  it: "reports.it",
  general: "reports.finance",
};

const ORDER: TabKey[] = [
  "finance",
  "marketing",
  "operations",
  "visitors",
  "hr",
  "it",
  "general",
];

export function ReportsTabs({
  locale: _locale,
  current,
}: {
  locale: string;
  current: TabKey;
}) {
  const t = useTranslations("admin.reports.tabs");
  const can = {
    finance: useCan("reports.finance", "read"),
    marketing: useCan("reports.marketing", "read"),
    operations: useCan("reports.ops", "read"),
    visitors: useCan("reports.visitors", "read"),
    hr: useCan("reports.hr", "read"),
    it: useCan("reports.it", "read"),
    general: useCan("reports.finance", "read"),
  };

  const visible = ORDER.filter((key) => can[key]);

  return (
    <div className="mt-4 border-b border-border">
      <nav className="-mb-px flex flex-wrap gap-1" aria-label="Report tabs">
        {visible.map((key) => {
          const active = key === current;
          return (
            <Link
              key={key}
              href={`?tab=${key}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-t-md px-4 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-primary bg-muted/50 text-foreground"
                  : "border-b-2 border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
            >
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export { TAB_MODULE };
