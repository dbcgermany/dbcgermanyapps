"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTheme } from "@dbc/ui";
import { toast } from "sonner";
import { signOutEverywhere } from "@/actions/account";

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
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
        await fetch("/auth/signout", { method: "POST" });
        router.push(`/${locale}/auth`);
        router.refresh();
      } catch {
        toast.error("Sign-out failed.");
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
      router.push(`/${locale}/auth`);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-semibold text-foreground hover:border-primary/40"
        aria-label="Open user menu"
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
              <span aria-hidden>👤</span> My account
            </Link>
            <Link
              href={`/${locale}/account?tab=preferences`}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <span aria-hidden>⚙</span> Preferences
            </Link>
            <Link
              href={`/${locale}/account?tab=security`}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <span aria-hidden>🔒</span> Security
            </Link>
          </div>

          <div className="border-t border-border px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </p>
            <div className="mt-1.5 flex gap-1">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium capitalize ${
                    theme === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t}
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
              <span aria-hidden>⎋</span> Sign out on all devices
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isPending}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
            >
              <span aria-hidden>→</span> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
