"use client";

import Link from "next/link";

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

const LABELS: Record<TabKey, { en: string; de: string; fr: string }> = {
  finance: {
    en: "Finance",
    de: "Finanzen",
    fr: "Finance",
  },
  marketing: { en: "Marketing", de: "Marketing", fr: "Marketing" },
  operations: { en: "Operations", de: "Betrieb", fr: "Opérations" },
  visitors: {
    en: "Visitors",
    de: "Besucher",
    fr: "Visiteurs",
  },
  hr: { en: "HR", de: "HR", fr: "RH" },
  it: { en: "IT", de: "IT", fr: "IT" },
  general: {
    en: "General",
    de: "Allgemein",
    fr: "Général",
  },
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
  locale,
  current,
}: {
  locale: string;
  current: TabKey;
}) {
  const lang = (["en", "de", "fr"].includes(locale) ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  return (
    <div className="mt-4 border-b border-border">
      <nav className="-mb-px flex flex-wrap gap-1" aria-label="Report tabs">
        {ORDER.map((key) => {
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
              {LABELS[key][lang]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
