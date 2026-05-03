import * as Sentry from "@sentry/nextjs";

type Severity = "error" | "warning" | "info";

interface CaptureContext {
  /** Short identifier of where the error came from — e.g. "stripe_webhook",
   *  "createCheckoutSession", "cron:release-reservations". Becomes a Sentry tag. */
  scope: string;
  /** Optional severity level. Defaults to "error". */
  severity?: Severity;
  /** Stable structured context (preferred over free-form strings). Each value
   *  is scrubbed by the global beforeSend hook before leaving the process. */
  data?: Record<string, unknown>;
}

// Single helper that every server-action / webhook / cron `catch` block
// can drop in next to the existing `console.error`. Parallel logging is
// intentional: console.error stays for Vercel runtime logs, Sentry gets
// the structured event for alerting + retention.
export function captureServerError(err: unknown, context: CaptureContext): void {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  const severity = context.severity ?? "error";

  Sentry.withScope((scope) => {
    scope.setTag("scope", context.scope);
    scope.setLevel(severity);
    if (context.data) {
      scope.setContext("data", context.data);
    }
    if (err instanceof Error) {
      Sentry.captureException(err);
    } else {
      Sentry.captureMessage(message, severity);
    }
  });
}
