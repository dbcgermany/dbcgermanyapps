"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRole } from "@dbc/types";
import { BRAND } from "@dbc/ui";
import { AdminSidebar } from "./admin-sidebar";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

/* -----------------------------------------------------------------------
 * Mobile drawer state — shared between sidebar (renders the drawer) and
 * the top bar (renders the burger).
 * ----------------------------------------------------------------------- */

interface AdminShellState {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const AdminShellContext = createContext<AdminShellState | null>(null);

export function useAdminShell(): AdminShellState {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error("useAdminShell must be used inside AdminShellLayout");
  return ctx;
}

/* -----------------------------------------------------------------------
 * Layout — the client half of AdminShell. Owns mobile-drawer state and
 * renders sidebar + sticky top bar + main. Data is fetched server-side
 * and passed in as props.
 * ----------------------------------------------------------------------- */

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export function AdminShellLayout({
  children,
  locale,
  userId,
  userRole,
  userEmail,
  displayName,
  avatarUrl,
  initialUnreadCount,
  initialNotifications,
}: {
  children: React.ReactNode;
  locale: string;
  userId: string;
  userRole: UserRole;
  userEmail: string;
  displayName: string | null;
  avatarUrl: string | null;
  initialUnreadCount: number;
  initialNotifications: NotificationRow[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const tShell = useTranslations("admin.shell");

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  // Auto-close on navigation (e.g. browser back/forward). Nav-link clicks
  // already call closeMobile directly, so in the common case this is a no-op.
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // Intentionally only depends on pathname — we want to fire on route
    // change, not on every mobileOpen flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while the drawer is open so iOS doesn't rubber-band
  // the underlying page.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const ctxValue = useMemo<AdminShellState>(
    () => ({ mobileOpen, openMobile, closeMobile, toggleMobile }),
    [mobileOpen, openMobile, closeMobile, toggleMobile]
  );

  return (
    <AdminShellContext.Provider value={ctxValue}>
      <div className="flex h-dvh overflow-hidden">
        <AdminSidebar locale={locale} userRole={userRole} userEmail={userEmail} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header
            className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-surface/85 px-3 backdrop-blur-xl supports-backdrop-filter:bg-surface/75 sm:px-4"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex h-14 items-center gap-2">
              <button
                type="button"
                onClick={toggleMobile}
                aria-label={tShell("mobileMenu")}
                aria-expanded={mobileOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted md:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <Link
                href={`/${locale}/dashboard`}
                className="flex items-center gap-2 font-heading text-base font-bold tracking-tight md:hidden"
                aria-label={BRAND.wordmarkAlt}
              >
                <Image
                  src={BRAND.logoSrc}
                  alt=""
                  width={72}
                  height={24}
                  className="h-5 w-auto"
                />
                <span>Germany</span>
                <span className="sr-only">DBC</span>
              </Link>
            </div>
            <div className="flex h-14 items-center gap-2">
              <NotificationBell
                userId={userId}
                locale={locale}
                initialUnreadCount={initialUnreadCount}
                initialNotifications={initialNotifications}
              />
              <UserMenu
                locale={locale}
                userEmail={userEmail}
                displayName={displayName}
                avatarUrl={avatarUrl}
                role={userRole}
              />
            </div>
          </header>
          <main className="dbc-admin-main flex-1 overflow-y-auto overscroll-contain bg-muted/30">
            <div
              className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}
