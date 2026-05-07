// Build a single-use auth URL that points at our /auth/confirm route on
// admin.dbc-germany.com instead of the raw `<project>.supabase.co/auth/v1/verify`
// URL. Email scanners pre-walk links in transit and burn the OTP before the
// human clicks; routing through our domain lets us catch the verify failure
// and forward `?error=otp_expired` to the destination page so the user sees
// a real message instead of a "no session" silent dead-end.
//
// `hashedToken` comes from `service.auth.admin.generateLink().properties.hashed_token`.
export function buildAuthConfirmUrl(
  hashedToken: string,
  type: "invite" | "recovery",
  locale: "en" | "de" | "fr"
): string {
  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
  const next = `/${locale}/set-password`;
  return `${adminUrl}/${locale}/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=${type}&next=${encodeURIComponent(next)}`;
}
