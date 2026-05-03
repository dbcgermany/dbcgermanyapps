import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "./scrub";

interface InitOpts {
  dsn?: string;
  environment?: string;
}

// Edge runtime init (middleware + edge route handlers). The edge runtime
// has no `node:crypto`, so the email-hashing path in scrubPii would fail
// at runtime — we accept that risk because edge-runtime errors rarely
// carry buyer PII (they fire from middleware which has no body access).
export function initSentryEdge(opts: InitOpts): void {
  if (!opts.dsn) return;
  Sentry.init({
    dsn: opts.dsn,
    environment: opts.environment ?? "development",
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: scrubPii,
    integrations: [],
  });
}
