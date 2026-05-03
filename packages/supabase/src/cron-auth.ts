// Fail-secure CRON_SECRET check shared across all cron endpoints in admin
// and tickets. If CRON_SECRET is not set, returns false — never allows
// anonymous access.
//
// Vercel cron is configured to send `Authorization: Bearer $CRON_SECRET`
// (the documented pattern when CRON_SECRET exists). We previously also
// accepted any non-empty `x-vercel-cron-signature` header as a fallback;
// dropped because that header is not HMAC-validated client-side and any
// upstream proxy / edge bypass would let through unauthenticated traffic
// to mass-cancel pending reservations.

export function isAuthorisedCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}
