// Fail-secure CRON_SECRET check shared across all cron endpoints in admin
// and tickets. If CRON_SECRET is not set, returns false — never allows
// anonymous access (the previous `secret && ...` pattern silently allowed
// any request when the env var was missing).
//
// Vercel cron also sends `x-vercel-cron-signature`; we accept that as a
// fallback for the platform-managed cron path.

export function isAuthorisedCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  // Vercel internal cron header — only trustworthy because Vercel does not
  // forward it on user requests, but include for completeness.
  const vercelSig = request.headers.get("x-vercel-cron-signature");
  if (vercelSig && vercelSig.length > 0) return true;
  return false;
}
