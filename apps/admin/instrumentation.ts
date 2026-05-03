// Next.js instrumentation hook — fires once per server runtime startup.
// Initialises Sentry for Node + Edge runtimes. The browser-side init lives
// in instrumentation-client.ts (Next 16 split convention).

import { initSentryServer, initSentryEdge, captureRequestError } from "@dbc/observability";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    initSentryServer({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? "development",
      release: process.env.VERCEL_GIT_COMMIT_SHA,
    });
  } else if (process.env.NEXT_RUNTIME === "edge") {
    initSentryEdge({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? "development",
    });
  }
}

// Next.js calls this on every uncaught error in Server Components / Route
// Handlers / Server Actions. Wiring it gives us the request context that
// the standard captureException doesn't carry on its own.
export const onRequestError = captureRequestError;
