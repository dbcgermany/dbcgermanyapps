import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@dbc/supabase/server";

// Server route that consumes a single-use Supabase OTP/invite token via
// `verifyOtp({ token_hash })`. We use this instead of mailing the raw
// `https://<project>.supabase.co/auth/v1/verify?...` URL because that URL is
// burned by corporate mail scanners (Defender Safe Links, Outlook ATP,
// Mimecast, Proofpoint, Gmail) before the human ever clicks. Routing through
// our own domain lets the scanner walk this endpoint instead — and the route
// returns the failure cleanly with `?error=` so the destination page can
// surface a real message instead of "no session".
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const redirectTo = new URL(next, request.url);

  if (!tokenHash || !type) {
    redirectTo.searchParams.set("error", "missing_token");
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    redirectTo.searchParams.set("error", "otp_expired");
    redirectTo.searchParams.set("error_description", error.message);
    return NextResponse.redirect(redirectTo);
  }

  // Recovery links have to land the user on /set-password regardless of
  // whether they previously completed an invite — without this flag the
  // proxy bounces an authenticated user away from /set-password to /dashboard
  // (see proxy.ts; /set-password is a public path, so authenticated visits
  // get redirected). The flag is cleared in set-password/page.tsx after a
  // successful password update, so the user isn't permanently trapped.
  if (type === "recovery") {
    await supabase.auth.updateUser({ data: { must_change_password: true } });
  }

  return NextResponse.redirect(redirectTo);
}
