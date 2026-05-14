"use client";

import { useEffect } from "react";
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
// gated by a sessionStorage flag so we never enter a reload loop on a real
// render bug.
const RELOAD_FLAG = "dbc_tickets_error_reloaded_once";

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

  // Only auto-reload if we haven't already done so this session — prevents an
  // infinite loop if the digest looks stale but the underlying cause is a
  // genuine render bug that survives a refresh.
  const alreadyReloaded =
    typeof window !== "undefined" &&
    window.sessionStorage?.getItem(RELOAD_FLAG) === "1";
  const stale = likelyStale && !alreadyReloaded;

  useEffect(() => {
    Sentry.captureException(error);
    console.error("[tickets] route error", error);
    if (!stale) return;
    try {
      window.sessionStorage?.setItem(RELOAD_FLAG, "1");
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
