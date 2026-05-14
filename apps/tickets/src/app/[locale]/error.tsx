"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandedError } from "@dbc/ui";

// See apps/admin/src/app/[locale]/error.tsx for the rationale — same
// silent-reload on stale server-action IDs, same sanitised description.
//
// Next.js 16 emits numeric-only digests (e.g. "3936991764") for production
// server-action errors instead of the named DEPLOYMENT_ID_MISMATCH /
// NEXT_ACTION_NOT_FOUND constants the older check was looking for. After a
// fresh deploy, any user with the page open still references the previous
// build's action IDs; clicking submit then throws with a numeric digest the
// matcher never caught, and the user landed on the static error screen.
//
// Strategy: treat any production-style numeric digest as recoverable too,
// gated by a sessionStorage timestamp so we never enter a tight reload loop
// on a real render bug — but stale-bundle errors that fire HOURS apart (e.g.
// across two deploys in the same day) DO get a fresh auto-reload each time.
// Previously stored the flag as "1" forever, which left users stuck on the
// static error screen after their second stale-action error and they had to
// clear site data manually.
const RELOAD_FLAG = "dbc_tickets_error_reloaded_at";
const RELOAD_GUARD_MS = 60_000; // 60s — short enough to break loops, long
                                // enough to recover across same-day deploys.

function isLikelyStaleActionError(err: Error & { digest?: string }): boolean {
  const msg = err.message ?? "";
  if (msg.includes("Server Action") && msg.includes("was not found")) return true;
  const digest = err.digest ?? "";
  if (
    digest.includes("DEPLOYMENT_ID_MISMATCH") ||
    digest.includes("NEXT_ACTION_NOT_FOUND")
  ) {
    return true;
  }
  // Next 16 production digest: a purely numeric hash. Treat as likely stale
  // and let the reload-once guard prevent loops if it turns out to be a real
  // render bug.
  return /^\d{6,}$/.test(digest);
}

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("errors");
  const likelyStale = isLikelyStaleActionError(error);

  // Loop guard: refuse to auto-reload if we already did so in the last
  // RELOAD_GUARD_MS. Older flags expire so a stale-bundle error fired hours
  // later still gets a fresh auto-reload. Computed in a useState initializer
  // so the (impure) Date.now() call runs exactly once on mount, not on every
  // render — keeps react-hooks/purity lint happy.
  const [recentlyReloaded] = useState(() => {
    if (typeof window === "undefined") return false;
    const raw = window.sessionStorage?.getItem(RELOAD_FLAG);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < RELOAD_GUARD_MS;
  });
  const stale = likelyStale && !recentlyReloaded;

  useEffect(() => {
    Sentry.captureException(error);
    console.error("[tickets] route error", error);
    if (!stale) return;
    try {
      window.sessionStorage?.setItem(RELOAD_FLAG, String(Date.now()));
    } catch {
      // sessionStorage may be unavailable (private mode, blocked) — proceed
      // with the reload anyway; the worst case is one extra reload on the
      // next error, not a loop.
    }
    const handle = setTimeout(() => window.location.reload(), 100);
    return () => clearTimeout(handle);
  }, [error, stale]);

  if (stale) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="text-sm">{t("tryAgain")}…</p>
      </div>
    );
  }

  return (
    <BrandedError
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      digest={error.digest ?? null}
      digestLabel={t("errorDigest")}
      resetLabel={t("tryAgain")}
      onReset={reset}
      secondaryHref={`/${locale}`}
      secondaryLabel={t("backToSafety")}
    />
  );
}
