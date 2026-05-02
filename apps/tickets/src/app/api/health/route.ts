import { NextResponse } from "next/server";

// Lightweight health endpoint for external uptime monitors (Better Stack,
// Pingdom, etc.). Returns 200 + JSON when the runtime can answer requests.
// Does NOT call Supabase / Stripe / Resend on every probe — those are
// reachable from upstream's own status pages and a deep-check would amplify
// failures during incidents (probe storms). Add a `?deep=1` query parameter
// to force a deeper check that pings Supabase.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";

  const result: Record<string, unknown> = {
    ok: true,
    app: "tickets",
    region: process.env.VERCEL_REGION ?? "local",
    deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    time: new Date().toISOString(),
  };

  if (deep) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      try {
        const r = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { apikey: anonKey },
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        result.supabase = r.ok ? "ok" : `http_${r.status}`;
      } catch {
        result.supabase = "unreachable";
        result.ok = false;
      }
    }
  }

  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
