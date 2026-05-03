"use client";

import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "./scrub";

interface InitOpts {
  dsn?: string;
  environment?: string;
  release?: string;
}

// Browser-side init. Called from each app's instrumentation-client.ts.
// Skips initialisation when DSN is missing so local dev / first deploys
// without env vars set don't fail — the SDK simply produces no events.
export function initSentryClient(opts: InitOpts): void {
  if (!opts.dsn) return;
  Sentry.init({
    dsn: opts.dsn,
    environment: opts.environment ?? "development",
    release: opts.release,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: scrubPii,
    beforeSendTransaction: scrubPii,
    // Tunnel is configured via withSentryConfig (`tunnelRoute: "/monitoring"`).
    // No Replay, no Profiling, no Logs — keeps quota predictable.
    integrations: [],
  });
}
