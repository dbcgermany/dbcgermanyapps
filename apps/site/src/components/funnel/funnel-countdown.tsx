"use client";

import { useEffect, useState } from "react";

// Ticks once a second toward the event's starts_at. The server renders an
// initial snapshot based on request time so there's no "00 : 00 : 00" flash
// before React hydrates; the client takes over from there.
const LABELS: Record<"en" | "de" | "fr", [string, string, string, string, string]> = {
  en: ["days", "hours", "minutes", "seconds", "Event has started"],
  de: ["Tage", "Std", "Min", "Sek", "Event läuft"],
  fr: ["jours", "h", "min", "s", "L'événement a commencé"],
};

function parts(msLeft: number) {
  if (msLeft <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(msLeft / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function FunnelCountdown({
  startsAt,
  locale,
  eyebrow,
}: {
  startsAt: string;
  locale: "en" | "de" | "fr";
  eyebrow?: string;
}) {
  const targetMs = new Date(startsAt).getTime();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = targetMs - now;
  const labels = LABELS[locale];
  const p = parts(left);

  if (left <= 0) {
    return (
      <section className="border-y border-border bg-muted/40 py-8 text-center">
        <p className="font-heading text-xl font-semibold">{labels[4]}</p>
      </section>
    );
  }

  const cells: Array<[number, string]> = [
    [p.days, labels[0]],
    [p.hours, labels[1]],
    [p.minutes, labels[2]],
    [p.seconds, labels[3]],
  ];

  return (
    <section className="border-y border-border bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <div
          className="mt-4 flex items-center justify-center gap-3 sm:gap-6 tabular-nums"
          aria-live="polite"
        >
          {cells.map(([value, label], i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="font-heading text-4xl font-bold leading-none sm:text-5xl">
                {i === 0 ? value : pad(value)}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
