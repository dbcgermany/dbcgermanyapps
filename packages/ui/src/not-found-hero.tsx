import * as React from "react";
import { cn } from "./utils";

export interface NotFoundHeroProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * Primary + optional secondary / tertiary actions. Rendered as rounded
   * buttons in descending visual weight. Pass hrefs, not onClick handlers —
   * this component stays server-friendly.
   */
  actions?: Array<{
    label: string;
    href: string;
    external?: boolean;
    variant?: "primary" | "secondary" | "ghost";
  }>;
  /** Code shown large on the left. Defaults to "404". */
  code?: string;
  className?: string;
}

const actionClass = (variant: "primary" | "secondary" | "ghost" = "primary") =>
  cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    variant === "primary" &&
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    variant === "secondary" &&
      "border border-border bg-background text-foreground hover:bg-muted",
    variant === "ghost" && "text-foreground hover:bg-muted"
  );

/**
 * DBC Germany branded 404/not-found hero. Uses a big primary-red code, a
 * bold heading, a muted description, and up to three rounded CTAs. The
 * accent bar picks up the primary color so it matches the design language
 * of ticket PDFs, the site header, and the email templates.
 */
export function NotFoundHero({
  eyebrow,
  title,
  description,
  actions,
  code = "404",
  className,
}: NotFoundHeroProps) {
  // Render as <section> (not <main>) so this composes inside a host
  // layout that already owns <main>. Height uses dynamic viewport
  // units minus typical site header+footer so the content visually
  // centers in the available space on both site and admin shells.
  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 sm:min-h-[calc(100dvh-12rem)] sm:py-24",
        className
      )}
    >
      {/* Soft gradient wash behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="relative">
          <p
            aria-hidden
            className="font-heading text-[min(28vw,13rem)] font-black leading-none tracking-tight text-primary"
          >
            {code}
          </p>
          {/* Decorative underline bar — same language as ticket-delivery email + poster */}
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
        </div>

        {actions && actions.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
            {actions.map((a) => (
              <a
                key={a.href}
                href={a.href}
                target={a.external ? "_blank" : undefined}
                rel={a.external ? "noopener noreferrer" : undefined}
                className={actionClass(a.variant)}
              >
                {a.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
