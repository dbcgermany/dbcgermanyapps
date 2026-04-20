"use client";

import * as React from "react";
import { cn } from "./utils";

export interface BrandedErrorProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Shown in muted monospace under the description when present. */
  digest?: string | null;
  /** Reset label — defaults to "Try again". */
  resetLabel?: string;
  /** Invoked when the primary button is clicked. Usually the `reset` prop
   *  Next.js passes to error.tsx. */
  onReset?: () => void;
  /** Optional secondary link (e.g. "Back to dashboard"). */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Large glyph shown on the left — defaults to "!". Use "!!" or a code
   *  to match the context. */
  code?: string;
  /** Digest label. Rarely needs overriding. */
  digestLabel?: string;
  className?: string;
}

const actionClass = (variant: "primary" | "secondary" = "primary") =>
  cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    variant === "primary" &&
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    variant === "secondary" &&
      "border border-border bg-background text-foreground hover:bg-muted"
  );

/**
 * DBC Germany branded error boundary. Visual language matches
 * NotFoundHero (big primary-red code, decorative underline bar, rounded
 * CTAs) but this variant is client-side and wires a reset callback
 * instead of a static link — suitable for Next.js `error.tsx` files.
 *
 * For `global-error.tsx` use `<BrandedErrorFallback />` instead — that
 * one uses inline styles so it renders even if layout CSS failed to
 * load.
 */
export function BrandedError({
  eyebrow,
  title,
  description,
  digest,
  resetLabel = "Try again",
  onReset,
  secondaryHref,
  secondaryLabel,
  code = "!",
  digestLabel = "Error digest",
  className,
}: BrandedErrorProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 sm:min-h-[calc(100dvh-12rem)] sm:py-24",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-accent/5"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="relative">
          <p
            aria-hidden
            className="font-heading text-[min(28vw,13rem)] font-black leading-none tracking-tight text-primary"
          >
            {code}
          </p>
          <span
            aria-hidden
            className="absolute left-1/2 top-full mt-2 h-1 w-24 -translate-x-1/2 rounded-full bg-primary"
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              {eyebrow}
            </p>
          )}
          {title && (
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
          {digest && (
            <p className="text-xs text-muted-foreground">
              {digestLabel}: <code>{digest}</code>
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className={actionClass("primary")}
            >
              {resetLabel}
            </button>
          )}
          {secondaryHref && secondaryLabel && (
            <a href={secondaryHref} className={actionClass("secondary")}>
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Global-error fallback                             */
/* -------------------------------------------------------------------------- */

export interface BrandedErrorFallbackProps {
  title?: string;
  description?: string;
  resetLabel?: string;
  digest?: string | null;
  digestLabel?: string;
  onReset?: () => void;
  /** Primary brand color in hex — defaults to DBC red. Kept inline-styled so
   *  this component renders even if layout CSS didn't load. */
  primary?: string;
  foreground?: string;
  background?: string;
}

/**
 * No-CSS fallback for `global-error.tsx`. When the root layout fails,
 * the app's stylesheets don't mount — so this component sets its own
 * inline styles with safe hex fallbacks (DBC red on near-white / near-
 * black), and includes its own <html><body>. Safe for all three apps.
 */
export function BrandedErrorFallback({
  title = "Something went wrong",
  description = "An unexpected error occurred.",
  resetLabel = "Try again",
  digest,
  digestLabel = "Error digest",
  onReset,
  primary = "#c8102e",
  foreground = "#111111",
  background = "#fafafa",
}: BrandedErrorFallbackProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: foreground,
          background,
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem", width: "100%" }}>
          <p
            aria-hidden
            style={{
              fontSize: "8rem",
              fontWeight: 900,
              lineHeight: 1,
              color: primary,
              margin: 0,
            }}
          >
            !
          </p>
          <div
            aria-hidden
            style={{
              height: "4px",
              width: "4rem",
              borderRadius: "9999px",
              background: primary,
              margin: "0.5rem auto 2rem",
            }}
          />
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              margin: "0 0 0.75rem",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.5,
              color: "#525252",
              margin: "0 0 1rem",
            }}
          >
            {description}
          </p>
          {digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#737373",
                margin: "0 0 1.5rem",
              }}
            >
              {digestLabel}:{" "}
              <code
                style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
              >
                {digest}
              </code>
            </p>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                background: primary,
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              {resetLabel}
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
