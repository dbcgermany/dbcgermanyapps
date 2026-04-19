"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { LogOut, Lock, Settings, User } from "lucide-react";
import { useTheme } from "@dbc/ui";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { signOutEverywhere } from "@/actions/account";
import { logout } from "@/actions/auth";

// Next.js throws a special "redirect" error from server actions to trigger
// client navigation. Different Next versions shape the error differently
// (message vs. digest), so check both so we don't mis-classify success as failure.
function isRedirectError(err: unknown): boolean {
  if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return true;
  const digest = (err as { digest?: unknown } | null | undefined)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export interface UserMenuProps {
  locale: string;
  userEmail: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
}

function initialsOf(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[\s@]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  locale,
  userEmail,
  displayName,
  avatarUrl,
  role,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const t = useTranslations("admin.userMenu");

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleSignOut() {
    startTransition(async () => {
      try {
        await logout(locale);
      } catch (err) {
        if (!isRedirectError(err)) {
          toast.error("Sign-out failed.");
        }
      }
    });
  }

  function handleSignOutEverywhere() {
    startTransition(async () => {
      const result = await signOutEverywhere();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Signed out on all devices.");
      try {
        await logout(locale);
      } catch (err) {
        if (!isRedirectError(err)) {
          toast.error("Sign-out failed.");
        }
      }
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-semibold text-foreground hover:border-primary/40"
        aria-label={t("openMenu")}
        aria-expanded={open}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initialsOf(displayName, userEmail)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initialsOf(displayName, userEmail)
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {displayName || userEmail.split("@")[0]}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {role.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="py-1">
            <Link
              href={`/${locale}/account`}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <User className="h-4 w-4" strokeWidth={1.75} /> {t("myAccount")}
            </Link>
            <Link
              href={`/${locale}/account?tab=preferences`}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} /> {t("preferences")}
            </Link>
            <Link
              href={`/${locale}/account?tab=security`}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <Lock className="h-4 w-4" strokeWidth={1.75} /> {t("security")}
            </Link>
          </div>

          <div className="border-t border-border px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("theme")}
            </p>
            <div className="mt-1.5 flex gap-1">
              {(["light", "dark"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium ${
                    theme === mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t(mode)}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={handleSignOutEverywhere}
              disabled={isPending}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} /> {t("signOutEverywhere")}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isPending}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} /> {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
