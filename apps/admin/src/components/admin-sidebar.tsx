"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Contact,
  DoorOpen,
  FileText,
  Info,
  LayoutDashboard,
  LineChart,
  Menu,
  Newspaper,
  ScanLine,
  ScrollText,
  Settings,
  ShoppingCart,
  Ticket,
  UserSquare,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@dbc/types";
import { ROLE_HIERARCHY } from "@dbc/types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  minRole: UserRole;
  dividerAbove?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: "team_member" },
  { label: "Reports", href: "/reports", icon: LineChart, minRole: "admin" },

  { label: "Events", href: "/events", icon: Calendar, minRole: "manager", dividerAbove: true },
  { label: "Send Tickets", href: "/tickets/send", icon: Ticket, minRole: "manager" },
  { label: "Orders", href: "/orders", icon: ShoppingCart, minRole: "manager" },
  { label: "Door Sale", href: "/door-sale", icon: DoorOpen, minRole: "team_member" },
  { label: "Scan", href: "/scan", icon: ScanLine, minRole: "team_member" },

  { label: "News", href: "/news", icon: Newspaper, minRole: "manager", dividerAbove: true },
  { label: "Applications", href: "/applications", icon: FileText, minRole: "manager" },
  { label: "Job Offers", href: "/job-offers", icon: Briefcase, minRole: "manager" },

  { label: "Contacts", href: "/contacts", icon: Contact, minRole: "manager", dividerAbove: true },
  { label: "Team", href: "/team", icon: UserSquare, minRole: "manager" },
  { label: "Staff", href: "/staff", icon: Users, minRole: "admin" },

  { label: "Notifications", href: "/notifications", icon: Bell, minRole: "team_member", dividerAbove: true },

  { label: "Company Info", href: "/company-info", icon: Building2, minRole: "manager", dividerAbove: true },
  { label: "Settings", href: "/settings", icon: Settings, minRole: "admin" },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText, minRole: "super_admin" },
  { label: "Dev Info", href: "/dev-info", icon: Info, minRole: "super_admin" },
];

const STORAGE_KEY = "admin-sidebar-collapsed";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const userLevel = ROLE_HIERARCHY[userRole];

  const visibleItems = NAV_ITEMS.filter(
    (item) => userLevel >= ROLE_HIERARCHY[item.minRole]
  );

  // Hydrate collapse state from localStorage on mount. This intentionally
  // calls setState inside the effect — SSR renders expanded; the client
  // adjusts once after mount to match the persisted preference.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* ── Mobile burger ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200 ${
          collapsed ? "w-17" : "w-64"
        }`}
      >
        {/* Header */}
        <div
          className={`flex h-16 items-center border-b border-border ${
            collapsed ? "justify-center px-2" : "justify-between px-6"
          }`}
        >
          {!collapsed && (
            <Link
              href={`/${locale}/dashboard`}
              className="font-heading text-lg font-bold tracking-tight"
            >
              DBC Germany
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {visibleItems.map((item, idx) => {
              const fullHref = `/${locale}${item.href}`;
              const isActive =
                pathname === fullHref || pathname.startsWith(fullHref + "/");
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  {item.dividerAbove && idx > 0 && !collapsed && (
                    <div aria-hidden className="my-2 h-px bg-border" />
                  )}
                  {item.dividerAbove && idx > 0 && collapsed && (
                    <div aria-hidden className="my-2 h-px bg-border mx-1" />
                  )}
                  <Link
                    href={fullHref}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center rounded-md text-sm font-medium transition-colors ${
                      collapsed
                        ? "justify-center px-0 py-2.5"
                        : "gap-3 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                    {!collapsed && item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={`border-t border-border ${
            collapsed ? "px-2 py-3 text-center" : "px-4 py-3"
          }`}
        >
          {!collapsed && (
            <>
              <p className="truncate text-sm font-medium">{userEmail}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole.replace("_", " ")}
              </p>
            </>
          )}
          <p className={`text-xs text-muted-foreground ${collapsed ? "mt-0" : "mt-3"}`}>
            {collapsed ? (
              <Link
                href={`/${locale}/dev-info`}
                title="Created by Narikia UG"
                className="text-foreground/60 hover:text-primary"
              >
                N
              </Link>
            ) : (
              <>
                Created by{" "}
                <Link
                  href={`/${locale}/dev-info`}
                  className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                >
                  Narikia UG
                </Link>
              </>
            )}
          </p>
        </div>
      </aside>

      {/* ── Mobile slide-in drawer (always expanded) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Link
                href={`/${locale}/dashboard`}
                className="font-heading text-lg font-bold tracking-tight"
              >
                DBC Germany
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-foreground hover:text-muted-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {visibleItems.map((item, idx) => {
                  const fullHref = `/${locale}${item.href}`;
                  const isActive =
                    pathname === fullHref ||
                    pathname.startsWith(fullHref + "/");
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      {item.dividerAbove && idx > 0 && (
                        <div aria-hidden className="my-2 h-px bg-border" />
                      )}
                      <Link
                        href={fullHref}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon
                          className="h-5 w-5 shrink-0"
                          strokeWidth={1.75}
                        />
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
              <p className="mt-3 text-xs text-muted-foreground">
                Created by{" "}
                <Link
                  href={`/${locale}/dev-info`}
                  className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                >
                  Narikia UG
                </Link>
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
