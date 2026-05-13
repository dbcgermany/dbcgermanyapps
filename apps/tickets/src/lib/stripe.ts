import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazy-initialised Stripe client shared by the checkout action + webhook
 * handler + dev helpers. Lives in lib/ so the module can be imported
 * during `next build` (page-data collection) without STRIPE_SECRET_KEY
 * being set.
 *
 * P2.1 — Live-mode guard. On first call, asserts the key prefix matches
 * the deploy environment so a misconfigured env (test key in production,
 * or live key in staging) fails fast at first checkout instead of silently
 * mis-charging real cards via the wrong account. The guard is intentionally
 * one-way: we let test keys through in production for emergency triage
 * (a Vercel preview deploy can run against test mode), but we WARN. A
 * live key in a non-production environment hard-throws.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }

  // Stripe issues two key kinds:
  //   sk_test_/sk_live_  — full secret keys
  //   rk_test_/rk_live_  — restricted keys (scoped subset of the above)
  // Both are valid for the Stripe SDK; this codebase uses restricted keys
  // in production. The guard accepts both prefix families and just checks
  // the test/live half matches the deploy environment.
  const isProd = process.env.VERCEL_ENV === "production";
  const isTestKey = key.startsWith("sk_test_") || key.startsWith("rk_test_");
  const isLiveKey = key.startsWith("sk_live_") || key.startsWith("rk_live_");

  if (!isTestKey && !isLiveKey) {
    throw new Error(
      "STRIPE_SECRET_KEY must start with 'sk_test_', 'sk_live_', 'rk_test_', or 'rk_live_'."
    );
  }
  if (!isProd && isLiveKey) {
    throw new Error(
      "Refusing to boot: live Stripe key detected in a non-production environment (VERCEL_ENV=" +
        (process.env.VERCEL_ENV ?? "undefined") +
        "). Use a test key for previews + dev."
    );
  }
  if (isProd && isTestKey) {
    // Don't throw — preserves an escape hatch for emergency triage on prod
    // with a test key — but make it loudly visible.
    console.error(
      "[stripe] WARNING: VERCEL_ENV=production but STRIPE_SECRET_KEY is a test key. No real money will move."
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
  });
  return _stripe;
}
