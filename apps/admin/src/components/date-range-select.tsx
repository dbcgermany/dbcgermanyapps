"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type DateRange = { from: string; to: string; label: string };

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Labels = {
  today: string;
  last7Days: string;
  last30Days: string;
  last90Days: string;
  yearToDate: string;
  custom: string;
};

function rangeForPreset(preset: string, labels: Labels): DateRange | null {
  const now = new Date();
  const today = isoDate(now);
  switch (preset) {
    case "today":
      return { from: today, to: today, label: labels.today };
    case "7d":
      return {
        from: isoDate(new Date(Date.now() - 6 * 86400000)),
        to: today,
        label: labels.last7Days,
      };
    case "30d":
      return {
        from: isoDate(new Date(Date.now() - 29 * 86400000)),
        to: today,
        label: labels.last30Days,
      };
    case "90d":
      return {
        from: isoDate(new Date(Date.now() - 89 * 86400000)),
        to: today,
        label: labels.last90Days,
      };
    case "ytd":
      return {
        from: isoDate(new Date(now.getFullYear(), 0, 1)),
        to: today,
        label: labels.yearToDate,
      };
    default:
      return null;
  }
}

/**
 * Neutral, locale-agnostic fallback used for SSR / redirect payloads where no
 * translation context is available. Keep in English; the client re-labels it
 * via the `DateRangeSelect` component as soon as it hydrates.
 */
export const DEFAULT_RANGE: DateRange = {
  from: isoDate(new Date(Date.now() - 29 * 86400000)),
  to: isoDate(new Date()),
  label: "30d",
};

export function DateRangeSelect({
  value,
  onChange,
  className = "",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  className?: string;
}) {
  const t = useTranslations("admin.dashboard.dateRange");
  const labels: Labels = {
    today: t("today"),
    last7Days: t("last7Days"),
    last30Days: t("last30Days"),
    last90Days: t("last90Days"),
    yearToDate: t("yearToDate"),
    custom: t("custom"),
  };
  const [preset, setPreset] = useState<string>("30d");

  function handlePreset(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setPreset(next);
    if (next === "custom") return;
    const r = rangeForPreset(next, labels);
    if (r) onChange(r);
  }

  function handleCustom(which: "from" | "to", date: string) {
    onChange({ ...value, [which]: date, label: labels.custom });
    setPreset("custom");
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={preset}
        onChange={handlePreset}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label={t("presetAria")}
      >
        <option value="today">{labels.today}</option>
        <option value="7d">{labels.last7Days}</option>
        <option value="30d">{labels.last30Days}</option>
        <option value="90d">{labels.last90Days}</option>
        <option value="ytd">{labels.yearToDate}</option>
        <option value="custom">{labels.custom}</option>
      </select>
      <input
        type="date"
        value={value.from}
        onChange={(e) => handleCustom("from", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label={t("from")}
      />
      <span aria-hidden className="text-muted-foreground">
        →
      </span>
      <input
        type="date"
        value={value.to}
        onChange={(e) => handleCustom("to", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label={t("to")}
      />
    </div>
  );
}
