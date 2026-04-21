"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BRAND } from "@dbc/ui";
import {
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
  Megaphone,
  Mail,
  Newspaper,
  ScanLine,
  ScrollText,
  Settings,
  ShoppingCart,
  UserSquare,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@dbc/types";
import { ROLE_HIERARCHY } from "@dbc/types";
import { useAdminShell } from "./admin-shell-layout";

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  minRole: UserRole;
  dividerAbove?: boolean;
  indent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: "team_member" },
  { labelKey: "reports", href: "/reports", icon: LineChart, minRole: "admin" },

  { labelKey: "events", href: "/events", icon: Calendar, minRole: "manager", dividerAbove: true },
  { labelKey: "orders", href: "/orders", icon: ShoppingCart, minRole: "manager" },
  { labelKey: "doorSale", href: "/door-sale", icon: DoorOpen, minRole: "team_member" },
  { labelKey: "scan", href: "/scan", icon: ScanLine, minRole: "team_member" },

  { labelKey: "news", href: "/news", icon: Newspaper, minRole: "manager", dividerAbove: true },
  { labelKey: "newsletters", href: "/newsletters", icon: Mail, minRole: "manager" },
  { labelKey: "funnels", href: "/funnels", icon: Zap, minRole: "manager" },
  { labelKey: "applications", href: "/applications", icon: FileText, minRole: "manager" },
  { labelKey: "jobOffers", href: "/job-offers", icon: Briefcase, minRole: "manager" },

  { labelKey: "allContacts", href: "/contacts", icon: Contact, minRole: "manager", dividerAbove: true },
  { labelKey: "partners", href: "/contacts?category=partners", icon: Contact, minRole: "manager", indent: true },
  { labelKey: "founders", href: "/contacts?category=founders", icon: Contact, minRole: "manager", indent: true },
  { labelKey: "investors", href: "/contacts?category=investors", icon: Contact, minRole: "manager", indent: true },
  { labelKey: "press", href: "/contacts?category=press", icon: Contact, minRole: "manager", indent: true },
  { labelKey: "team", href: "/team", icon: UserSquare, minRole: "manager" },
  { labelKey: "staff", href: "/staff", icon: Users, minRole: "admin" },

  { labelKey: "companyInfo", href: "/company-info", icon: Building2, minRole: "manager", dividerAbove: true },
  { labelKey: "settings", href: "/settings", icon: Settings, minRole: "admin" },
  { labelKey: "ads", href: "/ads", icon: Megaphone, minRole: "super_admin" },
  { labelKey: "auditLog", href: "/audit-log", icon: ScrollText, minRole: "super_admin" },
  { labelKey: "devInfo", href: "/dev-info", icon: Info, minRole: "super_admin" },
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
  const searchParams = useSearchParams();
  const tNav = useTranslations("admin.nav");
  const tShell = useTranslations("admin.shell");
  const { mobileOpen, closeMobile } = useAdminShell();
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

  return (
    <>
      {/* Mobile burger + body-scroll lock are owned by AdminShellLayout. */}

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
              className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
              aria-label={BRAND.wordmarkAlt}
            >
              <Image
                src={BRAND.logoSrc}
                alt=""
                width={88}
                height={28}
                className="h-5 w-auto"
                priority
              />
              <span>Germany</span>
              <span className="sr-only">DBC</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? tShell("expandSidebar") : tShell("collapseSidebar")}
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
              const [rawPath, rawQuery] = item.href.split("?");
              const fullHref = `/${locale}${rawPath}${rawQuery ? `?${rawQuery}` : ""}`;
              const basePath = `/${locale}${rawPath}`;
              const categoryParam = rawQuery
                ? new URLSearchParams(rawQuery).get("category")
                : null;
              const currentCategory = searchParams.get("category");

              let isActive: boolean;
              if (categoryParam) {
                isActive =
                  pathname === basePath && currentCategory === categoryParam;
              } else if (basePath === `/${locale}/contacts`) {
                // "All contacts" is active only when no category filter is set
                isActive = pathname === basePath && !currentCategory;
              } else {
                isActive =
                  pathname === basePath || pathname.startsWith(basePath + "/");
              }

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
                    title={collapsed ? tNav(item.labelKey) : undefined}
                    className={`flex items-center rounded-md text-sm transition-colors ${
                      collapsed
                        ? "justify-center px-0 py-2.5"
                        : item.indent
                          ? "gap-3 py-1.5 pl-9 pr-3 text-xs"
                          : "gap-3 px-3 py-2 font-medium"
                    } ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {(!item.indent || collapsed) && (
                      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                    )}
                    {!collapsed && tNav(item.labelKey)}
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
                title={`${tShell("createdBy")} Narikia UG`}
                className="text-foreground/60 hover:text-primary"
              >
                N
              </Link>
            ) : (
              <>
                {tShell("createdBy")}{" "}
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

      {/* ── Mobile slide-in drawer ──
          Always mounted so transforms animate cleanly on open/close.
          iOS spring easing for a native-feel drawer push. */}
      <div
        className="fixed inset-0 z-50 md:hidden"
        style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={closeMobile}
          aria-hidden
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`relative flex h-dvh w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl transition-transform duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Link
                href={`/${locale}/dashboard`}
                onClick={closeMobile}
                className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
                aria-label={BRAND.wordmarkAlt}
              >
                <Image
                  src={BRAND.logoSrc}
                  alt=""
                  width={88}
                  height={28}
                  className="h-5 w-auto"
                />
                <span>Germany</span>
                <span className="sr-only">DBC</span>
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
                aria-label={tShell("mobileMenuClose")}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <ul className="space-y-1">
                {visibleItems.map((item, idx) => {
                  const [rawPath, rawQuery] = item.href.split("?");
                  const fullHref = `/${locale}${rawPath}${rawQuery ? `?${rawQuery}` : ""}`;
                  const basePath = `/${locale}${rawPath}`;
                  const categoryParam = rawQuery
                    ? new URLSearchParams(rawQuery).get("category")
                    : null;
                  const currentCategory = searchParams.get("category");

                  let isActive: boolean;
                  if (categoryParam) {
                    isActive =
                      pathname === basePath && currentCategory === categoryParam;
                  } else if (basePath === `/${locale}/contacts`) {
                    isActive = pathname === basePath && !currentCategory;
                  } else {
                    isActive =
                      pathname === basePath ||
                      pathname.startsWith(basePath + "/");
                  }

                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      {item.dividerAbove && idx > 0 && (
                        <div aria-hidden className="my-2 h-px bg-border" />
                      )}
                      <Link
                        href={fullHref}
                        onClick={closeMobile}
                        className={`flex items-center gap-3 rounded-md transition-colors ${
                          item.indent
                            ? "py-1.5 pl-9 pr-3 text-xs"
                            : "px-3 py-2 text-sm font-medium"
                        } ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {!item.indent && (
                          <Icon
                            className="h-5 w-5 shrink-0"
                            strokeWidth={1.75}
                          />
                        )}
                        {tNav(item.labelKey)}
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
                {tShell("createdBy")}{" "}
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
    </>
  );
}
