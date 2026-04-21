"use client";

import Link from "next/link";
import { useFunnelCtaTracker } from "./funnel-analytics";

// Client-only anchor that fires a cta_click beacon before the browser
// navigates. Used by external-link funnels where the primary CTA points
// at another property (e.g. tickets.dbc-germany.com).
export function FunnelCtaLink({
  funnelId,
  locale,
  href,
  label,
}: {
  funnelId: string;
  locale: string;
  href: string;
  label: string;
}) {
  const trackClick = useFunnelCtaTracker(funnelId, locale);
  const isExternal = /^https?:\/\//.test(href);
  const className =
    "inline-flex min-h-[52px] items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] active:scale-100";

  if (isExternal) {
    return (
      <a
        href={href}
        onClick={trackClick}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
        <span aria-hidden className="ml-2">
          &rarr;
        </span>
      </a>
    );
  }

  return (
    <Link href={href} onClick={trackClick} className={className}>
      {label}
      <span aria-hidden className="ml-2">
        &rarr;
      </span>
    </Link>
  );
}
