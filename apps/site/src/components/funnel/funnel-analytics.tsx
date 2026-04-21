"use client";

import { useEffect, useRef } from "react";

// Client-side telemetry hooks for any /f/[slug] funnel page. Everything
// posts to /api/funnels/track via navigator.sendBeacon so navigation
// (e.g. an outbound CTA click) doesn't cancel the request.

type TrackType = "view" | "cta_click" | "conversion";

const SESSION_KEY = "dbc-funnel-session";
const UTM_KEY = "dbc-funnel-utm";

function ensureSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return `s-${Date.now()}`;
  }
}

// Read UTMs from the initial URL. If present, persist for the tab's
// lifetime so CTA clicks + conversions carry the same attribution as
// the original view. Falls back to any previously-stored UTMs.
type Utms = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

function ensureUtms(): Utms {
  if (typeof window === "undefined") {
    return { source: null, medium: null, campaign: null };
  }
  const params = new URLSearchParams(window.location.search);
  const fromUrl = {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
  };
  if (fromUrl.source || fromUrl.medium || fromUrl.campaign) {
    try {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
    } catch {
      /* ignore storage errors */
    }
    return fromUrl;
  }
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    if (raw) return JSON.parse(raw) as Utms;
  } catch {
    /* ignore */
  }
  return { source: null, medium: null, campaign: null };
}

function fire(
  funnelId: string,
  type: TrackType,
  locale: string | undefined
) {
  if (typeof window === "undefined") return;
  const utms = ensureUtms();
  const payload = JSON.stringify({
    funnelId,
    eventType: type,
    sessionId: ensureSessionId(),
    locale: locale ?? null,
    utmSource: utms.source,
    utmMedium: utms.medium,
    utmCampaign: utms.campaign,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
  });
  const url = "/api/funnels/track";
  const blob = new Blob([payload], { type: "application/json" });
  try {
    if (navigator.sendBeacon?.(url, blob)) return;
  } catch {
    /* fall through to fetch */
  }
  // Fire-and-forget fetch fallback (older browsers). keepalive lets
  // the request survive a navigation.
  void fetch(url, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Mount this once per funnel page to record a `view` event. Relies
 * on a ref guard so StrictMode double-invocation doesn't duplicate.
 */
export function FunnelAnalyticsBoot({
  funnelId,
  locale,
}: {
  funnelId: string;
  locale: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fire(funnelId, "view", locale);
  }, [funnelId, locale]);
  return null;
}

/**
 * Wires `onClick` on the primary CTA: beacons a `cta_click` event,
 * then lets the native navigation proceed. Pairs cleanly with an
 * outbound `<a href>` — beacon is guaranteed to flight even though
 * the page is about to unload.
 */
export function useFunnelCtaTracker(funnelId: string, locale: string) {
  return () => fire(funnelId, "cta_click", locale);
}

/**
 * Call on a conversion surface (e.g. thank-you page / wizard submit
 * success) to record the funnel's ultimate goal event.
 */
export function fireFunnelConversion(funnelId: string, locale: string) {
  fire(funnelId, "conversion", locale);
}
