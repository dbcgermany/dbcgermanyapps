"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserRole } from "@dbc/types";
import { ROLE_HIERARCHY } from "@dbc/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  minRole: UserRole;
  dividerAbove?: boolean;
}

// Ordered for daily workflow:
// 1) Dashboard & reports (overview)
// 2) Events → Tickets → Orders → Door Sale → Scan (event-running cluster)
// 3) News → Applications (incoming content/requests)
// 4) Team → Staff (people: public then internal)
// 5) Notifications (per-user inbox)
// 6) Company Info → Settings → Audit Log (configuration, admin-only)
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "\u2302", minRole: "team_member" },
  { label: "Reports", href: "/reports", icon: "\u2261", minRole: "admin" },

  { label: "Events", href: "/events", icon: "\u2605", minRole: "manager", dividerAbove: true },
  { label: "Tickets", href: "/tickets/send", icon: "\u2709", minRole: "manager" },
  { label: "Orders", href: "/orders", icon: "\u2606", minRole: "manager" },
  { label: "Door Sale", href: "/door-sale", icon: "\u2637", minRole: "team_member" },
  { label: "Scan", href: "/scan", icon: "\u29C9", minRole: "team_member" },

  { label: "News", href: "/news", icon: "\u270E", minRole: "manager", dividerAbove: true },
  { label: "Applications", href: "/applications", icon: "\u2618", minRole: "manager" },

  { label: "Contacts", href: "/contacts", icon: "\u2709", minRole: "manager", dividerAbove: true },
  { label: "Team", href: "/team", icon: "\u2603", minRole: "manager" },
  { label: "Staff", href: "/staff", icon: "\u263A", minRole: "admin" },

  { label: "Notifications", href: "/notifications", icon: "\u266A", minRole: "team_member", dividerAbove: true },

  { label: "Company Info", href: "/company-info", icon: "\u2302", minRole: "manager", dividerAbove: true },
  { label: "Settings", href: "/settings", icon: "\u2699", minRole: "admin" },
  { label: "Audit Log", href: "/audit-log", icon: "\u2318", minRole: "super_admin" },
];

export function AdminSidebar({
  locale,
  userRole,
  userEmail,
}: {
  locale: string;
  userRole: UserRole;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const userLevel = ROLE_HIERARCHY[userRole];

  const visibleItems = NAV_ITEMS.filter(
    (item) => userLevel >= ROLE_HIERARCHY[item.minRole]
  );

  // Lock body scroll while the drawer is open (mobile).
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const SidebarContents = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link
          href={`/${locale}/dashboard`}
          className="font-heading text-lg font-bold tracking-tight"
        >
          DBC Germany
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="md:hidden text-foreground hover:text-muted-foreground"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item, idx) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive =
              pathname === fullHref || pathname.startsWith(fullHref + "/");

            return (
              <li key={item.href}>
                {item.dividerAbove && idx > 0 && (
                  <div
                    aria-hidden
                    className="my-2 h-px bg-border"
                  />
                )}
                <Link
                  href={fullHref}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="truncate text-sm font-medium">{userEmail}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {userRole.replace("_", " ")}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile burger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <span aria-hidden className="text-xl">
          ☰
        </span>
      </button>

      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex h-full w-64 flex-col border-r border-border bg-surface">
        {SidebarContents}
      </aside>

      {/* Mobile slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl">
            {SidebarContents}
          </aside>
        </div>
      )}
    </>
  );
}
