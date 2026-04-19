"use client";

import Link from "next/link";
import { cn } from "./utils";

// Inline chevron — keeps @dbc/ui free of a lucide-react dependency so it
// can be consumed by any app in the monorepo without adding the icon pack.
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/**
 * iOS-native-feel back button. One SSOT for deep-page back navigation
 * across admin / site / tickets. Matches Apple HIG: tint-coloured chevron
 * + previous-section label, 44pt tap target, pill-shaped press state.
 *
 * Every app composes this above its PageHeader (or equivalent). The
 * `href` always points at the LOGICAL parent, not the browser history
 * entry — so a deep-linked user also lands somewhere sensible.
 */
export function PageBack({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-ml-2 mb-3 inline-flex min-h-11 items-center gap-0.5 rounded-md pl-1 pr-3 text-sm font-medium text-primary transition-colors hover:text-primary/80 active:bg-primary/10",
        className
      )}
    >
      <ChevronLeftIcon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
