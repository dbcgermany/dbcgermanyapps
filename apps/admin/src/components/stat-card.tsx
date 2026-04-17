"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@dbc/ui";

/**
 * SSOT KPI/stat card for dashboards and reports.
 * Shows a metric value + label + optional prior-period delta.
 *
 * Usage:
 *   <StatCard label="Total revenue" value="€12,340" delta={15.2} deltaLabel="vs prior" />
 *   <StatCard label="AOV" sub="Avg order value" value="€85" dense />
 */
export function StatCard({
  label,
  sub,
  value,
  delta,
  deltaLabel,
  dense,
}: {
  label: string;
  sub?: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  dense?: boolean;
}) {
  const direction =
    delta === undefined
      ? null
      : Math.abs(delta) < 0.5
        ? "flat"
        : delta > 0
          ? "up"
          : "down";

  return (
    <Card padding="sm" className="rounded-lg">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-heading font-bold ${dense ? "text-xl" : "text-2xl"}`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
      )}
      {direction && deltaLabel && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {direction === "up" && (
            <ArrowUpRight className="h-3.5 w-3.5 text-[var(--dbc-color-success)]" strokeWidth={1.75} />
          )}
          {direction === "down" && (
            <ArrowDownRight className="h-3.5 w-3.5 text-[var(--dbc-color-error)]" strokeWidth={1.75} />
          )}
          {direction === "flat" && (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          )}
          <span
            className={
              direction === "up"
                ? "text-[var(--dbc-color-success)]"
                : direction === "down"
                  ? "text-[var(--dbc-color-error)]"
                  : "text-muted-foreground"
            }
          >
            {delta !== undefined && Math.abs(delta) < 0.5
              ? "~"
              : delta !== undefined
                ? `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`
                : ""}
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      )}
    </Card>
  );
}
