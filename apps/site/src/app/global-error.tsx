"use client";

import { useEffect } from "react";
import { BrandedErrorFallback } from "@dbc/ui";

export default function SiteGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] global error", error);
  }, [error]);

  return (
    <BrandedErrorFallback
      title="Something went wrong"
      description="We couldn't load the page. Please try again."
      resetLabel="Try again"
      digest={error.digest ?? null}
      onReset={reset}
    />
  );
}
