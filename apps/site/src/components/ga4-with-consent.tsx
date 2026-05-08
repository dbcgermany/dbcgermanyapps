"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useSyncExternalStore } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasConsentedToCookies,
} from "@dbc/ui";

// Renders Google Analytics 4 only after the visitor has accepted cookies.
// useSyncExternalStore subscribes to the cookie-consent custom event the
// CookieConsent banner emits — the moment consent is granted the gtag
// script installs; the moment consent is reset/rejected it unmounts and
// gtag is no longer included in subsequent navigations.

function subscribe(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, callback);
  return () =>
    window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, callback);
}

export function Ga4WithConsent({ gaId }: { gaId: string | undefined }) {
  const consented = useSyncExternalStore(
    subscribe,
    () => hasConsentedToCookies(),
    () => false,
  );

  if (!gaId || !consented) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
