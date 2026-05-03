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

export const onRequestError = captureRequestError;
