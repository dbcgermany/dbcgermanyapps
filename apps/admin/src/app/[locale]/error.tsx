"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandedError } from "@dbc/ui";

// Signature of Next's "the client bundle references a server action ID
// that no longer exists on the server" error. Fires when a visitor
// submits a form from a tab that loaded before the latest deploy.
// NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is pinned on Vercel but Next 16 can
// still produce numeric-only digests for action errors that the older
// named-constant matcher missed. Treat numeric digests as likely stale,
// guarded by sessionStorage to prevent reload loops on real render bugs.
const RELOAD_FLAG = "dbc_admin_error_reloaded_once";

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
  const alreadyReloaded =
    typeof window !== "undefined" &&
    window.sessionStorage?.getItem(RELOAD_FLAG) === "1";
  const stale = likelyStale && !alreadyReloaded;

  useEffect(() => {
    Sentry.captureException(error);
    console.error("[admin] route error", error);
    if (!stale) return;
    try {
      window.sessionStorage?.setItem(RELOAD_FLAG, "1");
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
