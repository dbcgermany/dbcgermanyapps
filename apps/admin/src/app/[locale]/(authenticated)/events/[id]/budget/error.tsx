"use client";

// Route-level error boundary specifically for /events/[id]/budget. Catches
// whatever throws server-side and surfaces it to the operator + Sentry
// instead of falling through to the generic [locale] error page that
// masks the digest. Mirrors the company-info error boundary at
// apps/admin/src/app/[locale]/(authenticated)/company-info/error.tsx.

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@dbc/ui";

export default function BudgetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("scope", "budget/error-boundary");
      scope.setContext("error", {
        message: error.message,
        digest: error.digest ?? null,
        stack: error.stack ?? null,
      });
      Sentry.captureException(error);
    });
    // Also log to runtime so it shows up in Vercel function logs.
    console.error("[budget/error-boundary]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="mt-12 max-w-xl">
      <h1 className="font-heading text-2xl font-bold">
        Couldn’t load the budget page
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Engineering has been notified. The details below are also in the
        browser console.
      </p>
      <pre className="mt-4 max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap break-all">
        {error.message}
        {error.digest ? `\n\nDigest: ${error.digest}` : ""}
        {error.stack ? `\n\n${error.stack}` : ""}
      </pre>
      <div className="mt-4 flex gap-2">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
