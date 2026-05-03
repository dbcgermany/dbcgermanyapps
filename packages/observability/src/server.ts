import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "./scrub";

interface InitOpts {
  dsn?: string;
  environment?: string;
  release?: string;
}

// Node runtime init. Called from each app's instrumentation.ts when
// process.env.NEXT_RUNTIME === "nodejs".
export function initSentryServer(opts: InitOpts): void {
  if (!opts.dsn) return;
  Sentry.init({
    dsn: opts.dsn,
    environment: opts.environment ?? "development",
    release: opts.release,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: scrubPii,
    beforeSendTransaction: scrubPii,
    integrations: [],
  });
}

export const captureRequestError = Sentry.captureRequestError;
