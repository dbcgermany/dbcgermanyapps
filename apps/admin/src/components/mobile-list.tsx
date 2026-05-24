import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";

interface MobileListCell {
  /** Stable key for the row. */
  id: string;
  /** Primary line — title or display name. */
  title: ReactNode;
  /** Optional secondary line(s) — email, status, totals, etc. */
  meta?: ReactNode;
  /** Right-aligned trailing element (badge, amount, timestamp). */
  trailing?: ReactNode;
  /** When set, the whole row is a Link to this href. */
  href?: string;
}

/**
 * iOS-grouped cell list — the L1 "Simple list" pattern on mobile.
 *
 * Pair with DataTable behind a `md:` breakpoint:
 *   <MobileList items={...} renderCell={...} className="md:hidden" />
 *   <div className="hidden md:block"><DataTable ...>...</DataTable></div>
 *
 * Cells with `href` render a chevron and are clickable; without href they
 * render as static rows (use for display-only lists).
 */
export function MobileList<T>({
  items,
  renderCell,
  emptyMessage,
  emptyCta,
  className,
}: {
  items: ReadonlyArray<T>;
  renderCell: (item: T) => MobileListCell;
  emptyMessage?: string;
  emptyCta?: { label: string; href: string };
  className?: string;
}) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <EmptyState
        message={emptyMessage}
        cta={emptyCta}
        className={className}
      />
    );
  }

  return (
    <ul
      className={`divide-y divide-border overflow-hidden rounded-xl border border-border bg-card ${className ?? ""}`}
    >
      {items.map((item) => {
        const cell = renderCell(item);
        const body = (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{cell.title}</div>
              {cell.meta && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {cell.meta}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {cell.trailing}
              {cell.href && (
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground/70"
                  aria-hidden
                />
              )}
            </div>
          </div>
        );
        return (
          <li key={cell.id}>
            {cell.href ? (
              <Link
                href={cell.href}
                className="block transition-colors hover:bg-muted/40"
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
