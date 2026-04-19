"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DashboardAd } from "@/actions/dashboard-ads";

type Locale = "en" | "de" | "fr";

const ROTATE_MS = 7000;

function pick(ad: DashboardAd, field: "title" | "subtitle" | "cta_label", l: Locale): string | null {
  const localized = ad[`${field}_${l}` as keyof DashboardAd] as string | null;
  if (localized) return localized;
  const fallback = ad[`${field}_en` as keyof DashboardAd] as string | null;
  return fallback ?? null;
}

export function DashboardAdCarousel({
  ads,
  locale,
}: {
  ads: DashboardAd[];
  locale: string;
}) {
  const l: Locale =
    locale === "de" || locale === "fr" ? (locale as Locale) : "en";

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = ads.length;
  const current = ads[index % Math.max(total, 1)];

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (total < 2 || paused) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [total, paused]);

  const accent = useMemo(() => {
    const raw = current?.accent_color?.trim();
    if (!raw) return undefined;
    // accept shorthand or full hex; let invalid values fall through to default
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : undefined;
  }, [current?.accent_color]);

  if (total === 0 || !current) return null;

  return (
    <section
      aria-label="Sponsored messages"
      className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* slides — one active at a time, others fade-out */}
      <div className="relative h-33 w-full sm:h-38">
        {ads.map((ad, i) => {
          const active = i === index;
          const adTitle = pick(ad, "title", l);
          const adSubtitle = pick(ad, "subtitle", l);
          const adCtaLabel = pick(ad, "cta_label", l);
          const adAccent =
            ad.accent_color &&
            /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(ad.accent_color.trim())
              ? ad.accent_color.trim()
              : undefined;

          return (
            <div
              key={ad.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image_url}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-7000 ease-linear ${
                  active ? "scale-[1.04]" : "scale-100"
                }`}
                referrerPolicy="no-referrer"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {/* gradient from accent → transparent; ensures text is readable */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: adAccent
                    ? `linear-gradient(90deg, ${adAccent}e6 0%, ${adAccent}99 45%, transparent 85%)`
                    : "linear-gradient(90deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.05) 85%)",
                }}
              />
              {/* copy */}
              <div className="relative flex h-full max-w-3xl flex-col justify-center gap-1 px-6 py-4 text-white sm:px-8">
                <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur">
                  <span className="h-1 w-1 rounded-full bg-white/90" />
                  {l === "de" ? "Anzeige" : l === "fr" ? "Annonce" : "Sponsored"}
                </p>
                {adTitle && (
                  <h2 className="font-heading text-lg font-bold leading-tight sm:text-xl">
                    {adTitle}
                  </h2>
                )}
                {adSubtitle && (
                  <p className="line-clamp-2 max-w-xl text-xs leading-snug text-white/85 sm:text-sm">
                    {adSubtitle}
                  </p>
                )}
                {adCtaLabel && ad.cta_url && (
                  <a
                    href={ad.cta_url}
                    target={ad.cta_url.startsWith("http") ? "_blank" : undefined}
                    rel={ad.cta_url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"
                  >
                    {adCtaLabel}
                    <span aria-hidden>→</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* controls — only if multiple ads; visible on hover + keyboard focus */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous ad"
            className={`absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur transition-opacity hover:bg-black/55 focus-visible:opacity-100 ${paused ? "opacity-100" : "opacity-0"}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next ad"
            className={`absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur transition-opacity hover:bg-black/55 focus-visible:opacity-100 ${paused ? "opacity-100" : "opacity-0"}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* dots */}
          <div className="absolute bottom-2 right-3 z-10 flex gap-1.5">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ad ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* subtle accent blur decoration — hidden on no-accent ads */}
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `${accent}60` }}
        />
      )}
    </section>
  );
}
