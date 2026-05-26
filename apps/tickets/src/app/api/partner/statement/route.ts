import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { affiliateEnabled } from "@dbc/affiliate";

export async function GET(req: Request) {
  if (!affiliateEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  const token = url.searchParams.get("token");
  if (!path || !token) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validate the token is still active.
  const { data: ea } = await supabase
    .from("event_affiliates")
    .select("id, affiliate_id, token_expires_at, token_revoked_at")
    .eq("dashboard_token", token)
    .maybeSingle();
  if (
    !ea ||
    ea.token_revoked_at ||
    new Date(ea.token_expires_at) <= new Date()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the storage path belongs to this affiliate (path layout: {affiliate_id}/{payout_id}.pdf).
  if (!path.startsWith(`${ea.affiliate_id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: signed, error } = await supabase.storage
    .from("affiliate-statements")
    .createSignedUrl(path, 60 * 60);
  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Statement unavailable" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(signed.signedUrl, 302);
}
