"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandedError } from "@dbc/ui";

// See apps/admin/src/app/[locale]/error.tsx for the rationale — same
// silent-reload on stale server-action IDs, same sanitised description.
function isStaleServerActionError(err: Error & { digest?: string }): boolean {
  const msg = err.message ?? "";
  if (msg.includes("Server Action") && msg.includes("was not found")) return true;
  const digest = err.digest ?? "";
  return (
    digest.includes("DEPLOYMENT_ID_MISMATCH") ||
    digest.includes("NEXT_ACTION_NOT_FOUND")
  );
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
  const stale = isStaleServerActionError(error);

  useEffect(() => {
    console.error("[site] route error", error);
    if (!stale) return;
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
