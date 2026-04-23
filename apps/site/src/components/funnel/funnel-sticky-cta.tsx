"use client";

import { useEffect, useState } from "react";

// Bottom-stuck CTA bar that fades in once the hero has scrolled past and
// fades back out once the pricing section is in view (so it doesn't
// duplicate the primary buttons). Shows the cheapest tier's price + a
// tiny countdown so urgency follows the reader down the page.

const LABELS = {
  en: { scrollToBuy: "Reserve your seat", daysLeft: "d" },
  de: { scrollToBuy: "Platz sichern", daysLeft: "T" },
  fr: { scrollToBuy: "Réserver ta place", daysLeft: "j" },
} as const;

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function FunnelStickyCta({
  startingPriceLabel,
  eventStartsAt,
  locale,
}: {
  startingPriceLabel: string;
  eventStartsAt: string;
  locale: "en" | "de" | "fr";
}) {
  const t = LABELS[locale];
  const [visible, setVisible] = useState(false);
  const [days, setDays] = useState(() => daysUntil(eventStartsAt));

  useEffect(() => {
    function onScroll() {
      // Show after 600px of scroll; hide when pricing section is near
      // the viewport so we don't stack with the pricing buttons.
      const y = window.scrollY;
      const pricing = document.getElementById("pricing");
      const pricingTop = pricing?.getBoundingClientRect().top ?? Infinity;
      const near = pricingTop < window.innerHeight;
      setVisible(y > 600 && !near);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setDays(daysUntil(eventStartsAt)), 60 * 1000);
    return () => clearInterval(id);
  }, [eventStartsAt]);

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="pointer-events-auto mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur sm:px-5 sm:py-2.5">
        <div className="min-w-0 flex items-center gap-3">
          <span className="text-sm font-semibold truncate">
            {startingPriceLabel}
          </span>
          {days > 0 ? (
            <span className="hidden text-xs text-muted-foreground sm:inline tabular-nums">
              · {days}
              {t.daysLeft}
            </span>
          ) : null}
        </div>
        <a
          href="#pricing"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground sm:text-sm"
        >
          {t.scrollToBuy}
          <span aria-hidden className="ml-1">
            &rarr;
          </span>
        </a>
      </div>
    </div>
  );
}
