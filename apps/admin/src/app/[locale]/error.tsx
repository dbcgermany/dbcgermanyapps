"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandedError } from "@dbc/ui";

// Signature of Next's "the client bundle references a server action ID
// that no longer exists on the server" error. Fires when a visitor
// submits a form from a tab that loaded before the latest deploy.
// NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is pinned on Vercel but Next 16 can
// still produce numeric-only digests for action errors that the older
// named-constant matcher missed.
//
// Loop guard: store the LAST reload timestamp (not a boolean) and ignore
// it after RELOAD_GUARD_MS so a stale-bundle error fired hours later still
// gets a fresh auto-reload. Older boolean-flag approach left operators
// stuck on the static error screen after their second stale-action error
// in the same session.
const RELOAD_FLAG = "dbc_admin_error_reloaded_at";
const RELOAD_GUARD_MS = 60_000;

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
  // useState initializer keeps the (impure) Date.now() call out of the render
  // path — runs exactly once on mount, lint-clean.
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
    console.error("[admin] route error", error);
    if (!stale) return;
    try {
      window.sessionStorage?.setItem(RELOAD_FLAG, String(Date.now()));
    } catch {
      // sessionStorage unavailable — proceed with reload anyway.
    }
    // Brief pause so the reload isn't hit in the same tick as the
    // boundary mount (avoids the "stop reloading" heuristics in
    // some browsers).
    const handle = setTimeout(() => window.location.reload(), 100);
    return () => clearTimeout(handle);
  }, [error, stale]);

  // While the reload is in flight, render a bare branded skeleton
  // (no raw error text). The page replaces itself in ~100 ms.
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
      // Never surface error.message — it leaks Next-internal phrasing
      // ("Read more: nextjs.org/docs/messages/…") to visitors.
      description={t("description")}
      digest={error.digest ?? null}
      digestLabel={t("errorDigest")}
      resetLabel={t("tryAgain")}
      onReset={reset}
      secondaryHref={`/${locale}/dashboard`}
      secondaryLabel={t("backToSafety")}
    />
  );
}
