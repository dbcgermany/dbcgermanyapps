"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandedError } from "@dbc/ui";

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("[tickets] route error", error);
  }, [error]);

  return (
    <BrandedError
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={error.message || t("description")}
      digest={error.digest ?? null}
      digestLabel={t("errorDigest")}
      resetLabel={t("tryAgain")}
      onReset={reset}
      secondaryHref={`/${locale}`}
      secondaryLabel={t("backToSafety")}
    />
  );
}
