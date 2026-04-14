"use client";

import { useState } from "react";

export type DateRange = { from: string; to: string; label: string };

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForPreset(preset: string): DateRange | null {
  const now = new Date();
  const today = isoDate(now);
  switch (preset) {
    case "today":
      return { from: today, to: today, label: "Today" };
    case "7d":
      return {
        from: isoDate(new Date(Date.now() - 6 * 86400000)),
        to: today,
        label: "Last 7 days",
      };
    case "30d":
      return {
        from: isoDate(new Date(Date.now() - 29 * 86400000)),
        to: today,
        label: "Last 30 days",
      };
    case "90d":
      return {
        from: isoDate(new Date(Date.now() - 89 * 86400000)),
        to: today,
        label: "Last 90 days",
      };
    case "ytd":
      return {
        from: isoDate(new Date(now.getFullYear(), 0, 1)),
        to: today,
        label: "Year to date",
      };
    default:
      return null;
  }
}

export const DEFAULT_RANGE: DateRange =
  rangeForPreset("30d") ?? {
    from: "2026-01-01",
    to: isoDate(new Date()),
    label: "Last 30 days",
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
  const [preset, setPreset] = useState<string>("30d");

  function handlePreset(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setPreset(next);
    if (next === "custom") return;
    const r = rangeForPreset(next);
    if (r) onChange(r);
  }

  function handleCustom(which: "from" | "to", date: string) {
    onChange({ ...value, [which]: date, label: "Custom" });
    setPreset("custom");
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={preset}
        onChange={handlePreset}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label="Date range preset"
      >
        <option value="today">Today</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="ytd">Year to date</option>
        <option value="custom">Custom</option>
      </select>
      <input
        type="date"
        value={value.from}
        onChange={(e) => handleCustom("from", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label="From"
      />
      <span aria-hidden className="text-muted-foreground">
        →
      </span>
      <input
        type="date"
        value={value.to}
        onChange={(e) => handleCustom("to", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label="To"
      />
    </div>
  );
}
