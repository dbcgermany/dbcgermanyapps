// Re-export of @dbc/observability's captureServerError so server actions,
// webhook handlers, and cron endpoints can import it via the same `@/lib/...`
// alias they already use for other shared utilities. Drop next to existing
// `console.error` lines as a parallel call — keeps Vercel runtime logs and
// adds Sentry alerting on top.
export { captureServerError } from "@dbc/observability/observe";
