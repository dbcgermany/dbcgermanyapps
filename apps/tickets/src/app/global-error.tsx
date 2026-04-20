"use client";

import { useEffect } from "react";
import { BrandedErrorFallback } from "@dbc/ui";

export default function TicketsGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[tickets] global error", error);
  }, [error]);

  return (
    <BrandedErrorFallback
      title="Something went wrong"
      description="We couldn't load the ticketing app. Please try again."
      resetLabel="Try again"
      digest={error.digest ?? null}
      onReset={reset}
    />
  );
}
