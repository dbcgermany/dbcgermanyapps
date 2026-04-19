"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function CompanyInfoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("admin.dashboard.errorBoundary");

  useEffect(() => {
    console.error("[company-info] render failed", error);
  }, [error]);

  return (
    <section className="relative flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 sm:min-h-[calc(100dvh-12rem)] sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-accent/5"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="relative">
          <p
            aria-hidden
            className="font-heading text-[min(28vw,13rem)] font-black leading-none tracking-tight text-primary"
          >
            !
          </p>
          <span
            aria-hidden
            className="absolute left-1/2 top-full mt-2 h-1 w-24 -translate-x-1/2 rounded-full bg-primary"
          />
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t("titleCompanyInfo")}
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {error.message || t("generic")}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              {t("errorDigest")}: <code>{error.digest}</code>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("tryAgain")}
        </button>
      </div>
    </section>
  );
}
