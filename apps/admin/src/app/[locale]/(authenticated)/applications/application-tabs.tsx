"use client";

import Link from "next/link";

const LABELS = {
  en: { incubation: "Incubation", jobs: "Job applications" },
  de: { incubation: "Inkubation", jobs: "Stellenbewerbungen" },
  fr: { incubation: "Incubation", jobs: "Candidatures d’emploi" },
} as const;

export function ApplicationTabs({
  locale,
  activeTab,
}: {
  locale: string;
  activeTab: string;
}) {
  const labels = LABELS[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS];
  const tabs = [
    { key: "incubation", label: labels.incubation },
    { key: "jobs", label: labels.jobs },
  ];
  return (
    <div className="mt-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/${locale}/applications${tab.key === "incubation" ? "" : "?tab=" + tab.key}`}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
