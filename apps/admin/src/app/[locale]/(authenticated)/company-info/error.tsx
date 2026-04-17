"use client";

import { useEffect } from "react";
import { Card } from "@dbc/ui";

export default function CompanyInfoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[company-info] render failed", error);
  }, [error]);

  return (
    <div>
      <Card padding="md" className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
        <h1 className="font-heading text-lg font-semibold text-red-900 dark:text-red-200">
          Company Info failed to load
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-red-800 dark:text-red-300">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
            Error digest: <code>{error.digest}</code>
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </Card>
    </div>
  );
}
