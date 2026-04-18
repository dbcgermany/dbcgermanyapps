import type { ReactNode } from "react";

/**
 * SSOT responsive grid for stat cards and KPI blocks.
 * Enforces the DBC design rule: 4 columns max on desktop, never 3 or 5.
 *
 * `cols` prop drives the desktop column count:
 *   - 1: single card (hero stat)
 *   - 2: paired stats (e.g. "Before" vs "After")
 *   - 4: standard KPI row (default, most common)
 *
 * Mobile always stacks to 1 column; sm: goes to 2; lg: goes to the configured cols.
 * If a page needs more than 4 KPIs, split into multiple <StatGrid> rows.
 */
export function StatGrid({
  cols = 4,
  children,
  className,
}: {
  cols?: 1 | 2 | 4;
  children: ReactNode;
  className?: string;
}) {
  const gridClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid gap-4 ${gridClass}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
