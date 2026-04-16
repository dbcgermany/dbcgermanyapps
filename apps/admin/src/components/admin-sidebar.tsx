"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Calendar,
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

// Ordered for daily workflow:
// 1) Dashboard & reports (overview)
// 2) Events → Tickets → Orders → Door Sale → Scan (event-running cluster)
// 3) News → Applications (incoming content/requests)
// 4) Team → Staff (people: public then internal)
// 5) Notifications (per-user inbox)
// 6) Company Info → Settings → Audit Log → Dev Info (configuration, admin-only)
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: "team_member" },
  { label: "Reports", href: "/reports", icon: LineChart, minRole: "admin" },

  { label: "Events", href: "/events", icon: Calendar, minRole: "manager", dividerAbove: true },
  { label: "Tickets", href: "/tickets/send", icon: Ticket, minRole: "manager" },
  { label: "Orders", href: "/orders", icon: ShoppingCart, minRole: "manager" },
  { label: "Door Sale", href: "/door-sale", icon: DoorOpen, minRole: "team_member" },
  { label: "Scan", href: "/scan", icon: ScanLine, minRole: "team_member" },

  { label: "News", href: "/news", icon: Newspaper, minRole: "manager", dividerAbove: true },
  { label: "Applications", href: "/applications", icon: FileText, minRole: "manager" },

  { label: "Contacts", href: "/contacts", icon: Contact, minRole: "manager", dividerAbove: true },
  { label: "Team", href: "/team", icon: UserSquare, minRole: "manager" },
  { label: "Staff", href: "/staff", icon: Users, minRole: "admin" },

  { label: "Notifications", href: "/notifications", icon: Bell, minRole: "team_member", dividerAbove: true },

  { label: "Company Info", href: "/company-info", icon: Building2, minRole: "manager", dividerAbove: true },
  { label: "Settings", href: "/settings", icon: Settings, minRole: "admin" },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText, minRole: "super_admin" },
  { label: "Dev Info", href: "/dev-info", icon: Info, minRole: "super_admin" },
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
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item, idx) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive =
              pathname === fullHref || pathname.startsWith(fullHref + "/");
            const Icon = item.icon;

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
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
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
    </>
  );

  return (
    <>
      {/* Mobile burger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
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
