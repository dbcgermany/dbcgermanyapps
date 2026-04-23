// Vercel's public IPv4 egress ranges for the AWS regions its serverless /
// edge functions run from. When a user is logged in and the Next.js SSR
// path refreshes their Supabase token from one of these functions,
// auth.sessions.user_agent flips to "node" and .ip flips to one of the
// addresses below. Without this lookup, Active Sessions shows three-to-
// five scary-looking "node" entries that all actually belong to the
// same user — this utility reduces operator anxiety by labelling them
// as what they really are.
//
// Keep this short: we don't need every Vercel IP, only the ones we
// actually see in production. Extend freely when a new region appears.

const RANGES: Array<{ region: string; test: (ip: string) => boolean }> = [
  {
    region: "us-east-1 · Washington DC",
    test: (ip) => /^3\.231\./.test(ip) || /^34\.229\./.test(ip),
  },
  {
    region: "eu-central-1 · Frankfurt",
    test: (ip) => /^3\.125\./.test(ip),
  },
];

export function regionForVercelIp(ip: string | null): string | null {
  if (!ip) return null;
  for (const { region, test } of RANGES) {
    if (test(ip)) return region;
  }
  return null;
}

export function humaniseSessionLabel(
  ua: string | null,
  ip: string | null
): { label: string; isServer: boolean } {
  const isServer =
    ua !== null &&
    (ua.startsWith("node") || ua.startsWith("undici") || ua.startsWith("Deno"));
  if (isServer) {
    const region = regionForVercelIp(ip);
    return {
      label: region ? `Server refresh · Vercel (${region})` : "Server refresh",
      isServer: true,
    };
  }
  return { label: ua ?? "Unknown device", isServer: false };
}
