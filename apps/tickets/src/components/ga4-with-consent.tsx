"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useSyncExternalStore } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasConsentedToCookies,
} from "@dbc/ui";

// See apps/site/src/components/ga4-with-consent.tsx — same gate, kept
// per-app because both layouts mount their own copy.

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
