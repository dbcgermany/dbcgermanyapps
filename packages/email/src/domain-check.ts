/**
 * Lightweight Resend domain-verification check. Resend refuses to send
 * any email from an unverified domain, so every flow that sends to a
 * production `@dbc-germany.com` FROM address needs to check this
 * first — otherwise the send action throws per-recipient with a
 * cryptic 403, and the UI can only show "failed" after the fact.
 *
 * Cached for 5 minutes per process so we don't hit Resend on every
 * admin page render. Status changes (DNS verified → status flips to
 * "verified") arrive within the TTL which is fine for our use case.
 */

export type DomainStatus =
  | "verified"
  | "pending"
  | "failed"
  | "temporary_failure"
  | "not_started";

export interface DomainCheckResult {
  /** Resend's literal status string. */
  status: DomainStatus | string;
  /** True only when status === "verified". */
  verified: boolean;
  /** Short human-readable summary for admin banners. */
  message: string;
}

// Process-wide cache. Reset on redeploy.
let cached: { at: number; result: DomainCheckResult } | null = null;
const TTL_MS = 5 * 60_000;

const RESEND_DOMAIN_ID = "8263c261-d29e-4120-89af-2a7934b0bf3f";

/**
 * Returns the current Resend verification status for `dbc-germany.com`.
 * Safe to call from server components, server actions, and route
 * handlers. Fails open — if Resend is unreachable, returns `verified:
 * false` with a clear message so the caller blocks sending.
 */
export async function getResendDomainStatus(): Promise<DomainCheckResult> {
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.result;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const result: DomainCheckResult = {
      status: "not_started",
      verified: false,
      message: "RESEND_API_KEY is not configured on this environment.",
    };
    cached = { at: Date.now(), result };
    return result;
  }

  try {
    // In-memory cache (5 min TTL above) already dedupes within a single
    // server process. Next.js consumers get the same behaviour without
    // needing a framework-specific `next.revalidate` hint here.
    const res = await fetch(
      `https://api.resend.com/domains/${RESEND_DOMAIN_ID}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) {
      const result: DomainCheckResult = {
        status: "temporary_failure",
        verified: false,
        message: `Resend API ${res.status}. Treating as unverified.`,
      };
      cached = { at: Date.now(), result };
      return result;
    }
    const body = (await res.json()) as { status?: string };
    const status = body.status ?? "not_started";
    const verified = status === "verified";
    const result: DomainCheckResult = {
      status,
      verified,
      message: verified
        ? "Domain dbc-germany.com is verified in Resend."
        : `Resend domain dbc-germany.com is "${status}". Add the 3 DNS records at Strato (see cred/dns-email-setup.md) and wait 5-30 min for verification.`,
    };
    cached = { at: Date.now(), result };
    return result;
  } catch (err) {
    const result: DomainCheckResult = {
      status: "temporary_failure",
      verified: false,
      message: `Resend unreachable (${
        (err as Error).message ?? "network error"
      }). Treating as unverified.`,
    };
    cached = { at: Date.now(), result };
    return result;
  }
}

/** For tests / forced refresh. */
export function clearDomainCheckCache(): void {
  cached = null;
}
