"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "dbc-cookie-consent";

type ConsentState = "undecided" | "accepted" | "rejected";

export function CookieConsent({
  translations,
}: {
  translations: {
    title: string;
    description: string;
    accept: string;
    reject: string;
  };
}) {
  const [consent, setConsent] = useState<ConsentState>("undecided");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentState | null;
    if (stored) setConsent(stored);
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
  }

  function handleReject() {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setConsent("rejected");
  }

  // Don't render during SSR or if consent already given
  if (!mounted || consent !== "undecided") return null;

  return (
    <div
      role="dialog"
      aria-label={translations.title}
      className="fixed bottom-0 left-0 right-0 z-[500] border-t border-border bg-background p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="font-heading text-sm font-semibold">
            {translations.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {translations.description}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {translations.reject}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {translations.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Check if the user has accepted cookies (for analytics gating) */
export function hasConsentedToCookies(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

/** Reset consent state so the banner re-appears */
export function resetCookieConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event("cookie-consent-reset"));
}

export function CookieSettingsButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        resetCookieConsent();
        window.location.reload();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
