"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Always-visible bottom bar that follows the visitor through every funnel
// section, schedule, FAQ and closing pitch. Drives urgency via a BCS-style
// chip countdown (Days · Hours · Minutes · Seconds) on the deadline that
// matters most — the soonest tier `sales_end_at` if present, else the event
// start. Stays anchored even when the desktop tickets sidebar is in view —
// the chip countdown is meant to be in the visitor's peripheral vision at
// every scroll position.

type Parts = { d: number; h: number; m: number; s: number };

function compute(targetIso: string): Parts | null {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function EventStickyCta({
  eventStartsAt,
  ctaHref,
  ctaLabel,
  fromPriceLabel,
  deadlineIso,
  deadlineDisplayDate,
  scarcityCount,
  scarcityLabel,
}: {
  eventStartsAt: string;
  ctaHref: string;
  ctaLabel: string;
  fromPriceLabel?: string | null;
  deadlineIso?: string | null;
  deadlineDisplayDate?: string | null;
  scarcityCount?: number | null;
  scarcityLabel?: string;
}) {
  const t = useTranslations("tickets.event.detail");
  const targetIso = deadlineIso ?? eventStartsAt;

  const [parts, setParts] = useState<Parts | null>(() => compute(targetIso));

  useEffect(() => {
    // setInterval ticks at 1s — the eslint rule allows setState inside the
    // subscription callback, and the initial render value already comes from
    // the useState initializer above so we don't need a synchronous call.
    const id = setInterval(() => setParts(compute(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const showScarcity =
    scarcityCount != null && scarcityCount > 0 && parts !== null;
  const headerLabel = deadlineIso
    ? t("stickyEarlyBirdHeader")
    : t("stickyEventStartsHeader");

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-3 sm:pb-3"
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-auto max-w-5xl rounded-2xl bg-primary text-primary-foreground shadow-2xl ring-1 ring-black/10 backdrop-blur">
        {/* Top row — header + chips on the left, CTA on the right. Stacks
            vertically below md so the chips still get a full row on mobile. */}
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/85 md:text-[13px]">
              {headerLabel}
            </p>
            {parts ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Chip value={pad2(parts.d)} label={t("stickyChipDays")} />
                <Separator />
                <Chip value={pad2(parts.h)} label={t("stickyChipHours")} />
                <Separator />
                <Chip value={pad2(parts.m)} label={t("stickyChipMinutes")} />
                <Separator />
                <Chip value={pad2(parts.s)} label={t("stickyChipSeconds")} />
              </div>
            ) : (
              <div className="text-sm font-semibold">—</div>
            )}
          </div>

          <Link
            href={ctaHref}
            className="animate-wiggle-cta inline-flex shrink-0 items-center justify-center gap-1 self-stretch rounded-full bg-background px-5 py-3 text-sm font-bold uppercase tracking-wide text-primary shadow-sm transition-colors hover:bg-background/90 md:self-auto md:px-6 md:text-[13px]"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Bottom strip — supporting copy (price · until-date · scarcity). Only
            renders if any of the three signals exist. */}
        {(fromPriceLabel ||
          deadlineDisplayDate ||
          (showScarcity && scarcityLabel)) && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-primary-foreground/15 px-4 py-2 text-[12px] font-medium text-primary-foreground/90 md:px-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {deadlineDisplayDate && (
                <span className="tabular-nums">
                  {t("stickyUntilDate", { date: deadlineDisplayDate })}
                </span>
              )}
              {fromPriceLabel && (
                <>
                  {deadlineDisplayDate && (
                    <span aria-hidden className="text-primary-foreground/40">·</span>
                  )}
                  <span className="font-semibold">{fromPriceLabel}</span>
                </>
              )}
            </div>
            {showScarcity && scarcityLabel && (
              <span className="font-semibold tabular-nums">
                {scarcityLabel.replace("{n}", String(scarcityCount))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-11 flex-col items-center rounded-lg bg-black/55 px-2 py-1 sm:min-w-14 sm:px-3 sm:py-1.5">
      <span className="font-heading text-base font-bold tabular-nums leading-none text-white sm:text-xl">
        {value}
      </span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/65 sm:text-[9px]">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      className="text-base font-bold text-primary-foreground/55 sm:text-xl"
    >
      :
    </span>
  );
}
