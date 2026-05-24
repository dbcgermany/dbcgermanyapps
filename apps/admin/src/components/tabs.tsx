import Link from "next/link";
import type { ReactNode } from "react";

interface TabItem {
  /** URL the tab navigates to. */
  href: string;
  /** Display label. */
  label: string;
  /** Render this tab as currently selected. */
  active?: boolean;
  /** Optional right-aligned counter, badge, etc. */
  trailing?: ReactNode;
}

/**
 * Link-based tabs. Replaces the 4 bespoke implementations across
 * /reports, /applications, /contacts, /legal-pages. Active state is
 * driven by the caller (compute against searchParams or pathname).
 *
 * Usage:
 *   <Tabs
 *     items={[
 *       { href: `?status=active`, label: t("active"), active: status === "active" },
 *       { href: `?status=pending`, label: t("pending"), active: status === "pending", trailing: <Badge>{pendingCount}</Badge> },
 *     ]}
 *   />
 */
export function Tabs({
  items,
  className,
}: {
  items: ReadonlyArray<TabItem>;
  className?: string;
}) {
  return (
    <nav
      className={`flex flex-wrap items-center gap-1 border-b border-border ${className ?? ""}`}
      aria-label="Tabs"
    >
      {items.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`inline-flex items-center gap-2 -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            tab.active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.trailing}
        </Link>
      ))}
    </nav>
  );
}
