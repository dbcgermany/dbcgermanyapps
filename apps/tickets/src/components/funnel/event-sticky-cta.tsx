"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Bottom-stuck CTA that follows the visitor through every funnel section,
// every speaker profile, the schedule, the FAQ, and the closing pitch.
//
// Carries the four FOMO signals the user picked: live event countdown,
// "From €X" cheapest-tier price, optional sales-deadline countdown
// ("Early bird ends 2d 4h"), and optional scarcity badge ("Only 12 left").
//
// Hides automatically when the desktop tickets sidebar is in view (avoids
// stacking with the primary "Get tickets" button) and slides in only after
// the reader has scrolled past the hero (~500px).

type Parts = { d: number; h: number; m: number };

function compute(targetIso: string): Parts | null {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
  };
}

export function EventStickyCta({
  eventStartsAt,
  ctaHref,
  ctaLabel,
  fromPriceLabel,
  deadlineIso,
  deadlinePrefix,
  scarcityCount,
  scarcityLabel,
  hideWhenInViewSelector = "#tickets-sidebar",
}: {
  eventStartsAt: string;
  ctaHref: string;
  ctaLabel: string;
  fromPriceLabel?: string | null;
  deadlineIso?: string | null;
  deadlinePrefix?: string;
  scarcityCount?: number | null;
  scarcityLabel?: string;
  hideWhenInViewSelector?: string;
}) {
  const [eventParts, setEventParts] = useState<Parts | null>(() =>
    compute(eventStartsAt),
  );
  const [deadlineParts, setDeadlineParts] = useState<Parts | null>(() =>
    deadlineIso ? compute(deadlineIso) : null,
  );
  const [visible, setVisible] = useState(false);
  const [hiddenByPanel, setHiddenByPanel] = useState(false);

  useEffect(() => {
    function tick() {
      setEventParts(compute(eventStartsAt));
      if (deadlineIso) setDeadlineParts(compute(deadlineIso));
    }
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, [eventStartsAt, deadlineIso]);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const target = document.querySelector(hideWhenInViewSelector);
    if (!target) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setHiddenByPanel(e?.isIntersecting ?? false);
      },
      { threshold: 0.2 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [hideWhenInViewSelector]);

  // Pick the more urgent of (deadline) vs (scarcity) for the mobile second line.
  // Keep both for the desktop single row.
  const showDeadline = !!deadlineParts;
  const showScarcity = scarcityCount != null && scarcityCount > 0;

  const eventSegments: string[] = [];
  if (eventParts) {
    if (eventParts.d > 0) eventSegments.push(`${eventParts.d}d`);
    eventSegments.push(`${eventParts.h}h`);
    if (eventParts.d === 0) eventSegments.push(`${eventParts.m}m`);
  }
  const eventLabel = eventSegments.join(" ");

  const deadlineLabel = deadlineParts
    ? [
        deadlinePrefix,
        deadlineParts.d > 0 ? `${deadlineParts.d}d` : null,
        `${deadlineParts.h}h`,
        deadlineParts.d === 0 ? `${deadlineParts.m}m` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  const shouldShow = visible && !hiddenByPanel;

  return (
    <div
      aria-hidden={!shouldShow}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 transition-all duration-300 ${
        shouldShow ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur">
        {/* Desktop: single row with all signals */}
        <div className="hidden items-center justify-between gap-4 px-5 py-3 md:flex">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            {eventLabel && (
              <span className="font-semibold tabular-nums text-primary">
                {eventLabel}
              </span>
            )}
            {fromPriceLabel && (
              <>
                <span className="text-muted-foreground" aria-hidden>·</span>
                <span className="font-semibold">{fromPriceLabel}</span>
              </>
            )}
            {showDeadline && deadlineLabel && (
              <>
                <span className="text-muted-foreground" aria-hidden>·</span>
                <span className="text-xs font-medium tabular-nums text-warning-strong">
                  {deadlineLabel}
                </span>
              </>
            )}
            {showScarcity && (
              <>
                <span className="text-muted-foreground" aria-hidden>·</span>
                <span className="text-xs font-medium text-danger-strong">
                  {scarcityLabel?.replace("{n}", String(scarcityCount))}
                </span>
              </>
            )}
          </div>
          <Link
            href={ctaHref}
            className="animate-wiggle-cta inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Mobile: two-line bar — countdown + price + buy on top, single
            higher-FOMO pill on the second line. */}
        <div className="flex flex-col gap-2 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              {eventLabel && (
                <span className="font-semibold tabular-nums text-primary">
                  {eventLabel}
                </span>
              )}
              {fromPriceLabel && (
                <>
                  <span className="text-muted-foreground" aria-hidden>·</span>
                  <span className="truncate font-semibold">{fromPriceLabel}</span>
                </>
              )}
            </div>
            <Link
              href={ctaHref}
              className="animate-wiggle-cta inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              {ctaLabel}
            </Link>
          </div>
          {(showScarcity || (showDeadline && deadlineLabel)) && (
            <div className="text-center text-[11px] font-medium tabular-nums">
              {showScarcity ? (
                <span className="text-danger-strong">
                  {scarcityLabel?.replace("{n}", String(scarcityCount))}
                </span>
              ) : (
                <span className="text-warning-strong">{deadlineLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
