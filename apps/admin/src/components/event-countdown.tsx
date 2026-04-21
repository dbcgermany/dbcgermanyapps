"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

type Locale = "en" | "de" | "fr";

const LABELS: Record<Locale, {
  next: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  live: string;
}> = {
  en: { next: "Next event", days: "days", hours: "hrs", minutes: "min", seconds: "sec", live: "Live now" },
  de: { next: "N\u00e4chstes Event", days: "Tage", hours: "Std", minutes: "Min", seconds: "Sek", live: "L\u00e4uft jetzt" },
  fr: { next: "Prochain \u00e9v\u00e9nement", days: "jours", hours: "h", minutes: "min", seconds: "sec", live: "En direct" },
};

function computeParts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, isLive: diff === 0 };
}

/**
 * Live-updating countdown banner. Sits on top of the dashboard ad
 * carousel so operators see the next upcoming event's exact
 * days / hours / minutes at a glance. Re-renders every second on
 * the client; the event data comes from the page server action.
 */
export function EventCountdown({
  title,
  startsAtIso,
  venue,
  locale,
  href,
}: {
  title: string;
  startsAtIso: string;
  venue?: string | null;
  locale: string;
  href: string;
}) {
  const l: Locale = (locale === "de" || locale === "fr" ? locale : "en") as Locale;
  const t = LABELS[l];
  const target = new Date(startsAtIso).getTime();
  const [parts, setParts] = useState(() => computeParts(target, Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setParts(computeParts(target, Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const bcp47 = l === "de" ? "de-DE" : l === "fr" ? "fr-FR" : "en-GB";
  const startsAt = new Date(startsAtIso);
  const dateText = startsAt.toLocaleDateString(bcp47, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeText = startsAt.toLocaleTimeString(bcp47, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <a
      href={href}
      className="mb-4 block overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 transition-colors hover:border-primary/40 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CalendarClock className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {t.next}
            </p>
            <p className="mt-0.5 truncate text-base font-heading font-bold sm:text-lg">
              {title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {dateText} · {timeText}
              {venue ? ` · ${venue}` : ""}
            </p>
          </div>
        </div>
        {parts.isLive ? (
          <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            {t.live}
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Unit value={parts.days} label={t.days} />
            <Colon />
            <Unit value={parts.hours} label={t.hours} pad />
            <Colon />
            <Unit value={parts.minutes} label={t.minutes} pad />
            <Colon />
            <Unit value={parts.seconds} label={t.seconds} pad />
          </div>
        )}
      </div>
    </a>
  );
}

function Unit({ value, label, pad }: { value: number; label: string; pad?: boolean }) {
  const display = pad && value < 10 ? `0${value}` : String(value);
  return (
    <div className="flex min-w-[2.25rem] flex-col items-center">
      <span className="font-heading text-xl font-bold leading-none tabular-nums text-foreground sm:text-2xl">
        {display}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span aria-hidden className="font-heading text-xl font-bold leading-none text-muted-foreground sm:text-2xl">
      :
    </span>
  );
}
