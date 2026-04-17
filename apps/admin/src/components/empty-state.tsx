import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/**
 * SSOT empty-state placeholder for lists, tables, and grids.
 * Shows an icon + message + optional CTA button.
 *
 * Usage:
 *   <EmptyState message="No events yet." cta={{ label: "Create event", href: "/events/new" }} />
 */
export function EmptyState({
  icon: Icon = Inbox,
  message,
  cta,
  className,
}: {
  icon?: LucideIcon;
  message: string;
  cta?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center ${className ?? ""}`}
    >
      <Icon
        className="h-10 w-10 text-muted-foreground/50"
        strokeWidth={1.25}
      />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          {cta.label}
          <span aria-hidden>&rarr;</span>
        </Link>
      )}
    </div>
  );
}
