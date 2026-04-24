"use client";

import { useEffect, useState } from "react";

// Per-tier "sales end in Xd Yh" countdown. Ticks every 30 s (seconds
// precision isn't useful at multi-day ranges, and we don't want 3 of
// these thrashing the main thread). Renders null when the deadline is
// further than policy.warnHours away, already past, or missing.
//
// All `Date.now()` calls live inside effects / the lazy-init closure of
// useState to satisfy react-hooks/purity.

interface Parts {
  days: number;
  hours: number;
  minutes: number;
}

function compute(target: Date, warnHours: number): Parts | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  if (diff > warnHours * 3_600_000) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

export function TierDeadlineCountdown({
  salesEndAt,
  warnHours,
  labels,
}: {
  salesEndAt: string | null;
  warnHours: number;
  labels: { prefix: string; d: string; h: string; m: string };
}) {
  const target = salesEndAt ? new Date(salesEndAt) : null;
  const [parts, setParts] = useState<Parts | null>(() =>
    target ? compute(target, warnHours) : null
  );

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const next = compute(target, warnHours);
      setParts(next);
      return next;
    };
    // Recompute once on mount so SSR (which may have rendered a stale
    // null if the deadline just entered the warn window) reconciles.
    if (tick() == null) return;
    const id = setInterval(() => {
      if (tick() == null) clearInterval(id);
    }, 30_000);
    return () => clearInterval(id);
  }, [target?.getTime(), warnHours]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!parts) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
      <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
      <span>
        {labels.prefix}{" "}
        {parts.days > 0 && <>{parts.days}{labels.d} </>}
        {parts.hours}{labels.h} {parts.minutes}{labels.m}
      </span>
    </span>
  );
}
