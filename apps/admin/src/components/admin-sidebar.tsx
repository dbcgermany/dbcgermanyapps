"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@dbc/types";
import { ROLE_HIERARCHY } from "@dbc/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  minRole: UserRole;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "\u2302", minRole: "team_member" },
  { label: "Scan", href: "/scan", icon: "\u29C9", minRole: "team_member" },
  { label: "Door Sale", href: "/door-sale", icon: "\u2637", minRole: "team_member" },
  { label: "Events", href: "/events", icon: "\u2605", minRole: "manager" },
  { label: "News", href: "/news", icon: "\u270E", minRole: "manager" },
  { label: "Applications", href: "/applications", icon: "\u2618", minRole: "manager" },
  { label: "Orders", href: "/orders", icon: "\u2606", minRole: "manager" },
  { label: "Tickets", href: "/tickets/send", icon: "\u2709", minRole: "manager" },
  { label: "Staff", href: "/staff", icon: "\u263A", minRole: "admin" },
  { label: "Reports", href: "/reports", icon: "\u2261", minRole: "admin" },
  { label: "Notifications", href: "/notifications", icon: "\u266A", minRole: "team_member" },
  { label: "Audit Log", href: "/audit-log", icon: "\u2318", minRole: "super_admin" },
  { label: "Settings", href: "/settings", icon: "\u2699", minRole: "admin" },
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
  const userLevel = ROLE_HIERARCHY[userRole];

  const visibleItems = NAV_ITEMS.filter(
    (item) => userLevel >= ROLE_HIERARCHY[item.minRole]
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href={`/${locale}/dashboard`}
          className="font-heading text-lg font-bold tracking-tight"
        >
          DBC Germany
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive =
              pathname === fullHref || pathname.startsWith(fullHref + "/");

            return (
              <li key={item.href}>
                <Link
                  href={fullHref}
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

      {/* User info */}
      <div className="border-t border-border px-4 py-3">
        <p className="truncate text-sm font-medium">{userEmail}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {userRole.replace("_", " ")}
        </p>
      </div>
    </aside>
  );
}
