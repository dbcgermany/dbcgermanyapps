"use client";

import { useEffect } from "react";
import { BrandedErrorFallback } from "@dbc/ui";

/**
 * Root error boundary — catches failures in the root layout itself, so
 * it must ship its own <html><body>. Uses inline styles because the
 * app's stylesheets may not have mounted. Strings are English only;
 * locale context isn't available from here.
 */
export default function AdminGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] global error", error);
  }, [error]);

  return (
    <BrandedErrorFallback
      title="Something went wrong"
      description="An unexpected error occurred. Please try again or return to the dashboard."
      resetLabel="Try again"
      digest={error.digest ?? null}
      onReset={reset}
    />
  );
}
