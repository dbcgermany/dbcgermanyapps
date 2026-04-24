"use client";

import { useEffect, useState } from "react";
import type { RecentBuyer } from "@/actions/triggers";

// Rotating ribbon above the tier list. Anonymised by design — no
// names even when consent exists (see plan §"Privacy rule for the
// ticker"). Renders as a server-seeded list; the client just rotates
// through the slots on a 4 s interval. New buyers appear on the next
// full page revalidation cycle (every 30 s — see page.tsx's
// `revalidate = 30`).

interface Labels {
  prefixWithCity: string; // e.g. "Someone from"
  prefixAnon: string; // e.g. "Someone just bought a"
  middleKnownCity: string; // between city and tier name: "just bought a"
  middleAnon: string; // kept for symmetry, maps to prefixAnon
  ticketSuffix: string; // "ticket"
  ago: {
    justNow: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
  };
}

function relativeTime(iso: string, labels: Labels["ago"]) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return labels.justNow;
  if (mins < 60) return labels.minutes(mins);
  const hours = Math.floor(mins / 60);
  return labels.hours(hours);
}

export function RecentBuyerTicker({
  buyers,
  labels,
}: {
  buyers: RecentBuyer[];
  labels: Labels;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (buyers.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % buyers.length);
    }, 4000);
    return () => clearInterval(id);
  }, [buyers.length]);

  if (buyers.length === 0) return null;
  const current = buyers[index];
  const ago = relativeTime(current.createdAt, labels.ago);

  const line = current.city
    ? `${labels.prefixWithCity} ${current.city} ${labels.middleKnownCity} ${current.tierName} ${labels.ticketSuffix}`
    : `${labels.prefixAnon} ${current.tierName} ${labels.ticketSuffix}`;

  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400"
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" />
      <span className="font-medium">{line}</span>
      <span className="ml-1 opacity-70">· {ago}</span>
    </div>
  );
}
