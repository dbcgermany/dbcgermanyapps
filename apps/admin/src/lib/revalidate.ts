// Fire-and-forget on-demand revalidation for the site or tickets app.
// Admin actions call this after writes so public pages refresh within
// seconds instead of waiting for the 30–60s ISR window. Silent if the
// target URL or REVALIDATE_SECRET isn't configured (e.g. local dev).
//
// Paths use Next.js literal form with bracketed dynamic segments so
// every locale invalidates at once — e.g. "/[locale]/news" refreshes
// /en/news, /de/news, /fr/news in a single call.

type Target = "site" | "tickets";

function targetBase(target: Target): string | null {
  if (target === "site") return process.env.NEXT_PUBLIC_SITE_URL ?? null;
  if (target === "tickets") return process.env.NEXT_PUBLIC_TICKETS_URL ?? null;
  return null;
}

export async function pingRevalidate(target: Target, paths: string[]) {
  const base = targetBase(target);
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret || paths.length === 0) return;
  await Promise.all(
    paths.map((path) =>
      fetch(`${base}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, secret }),
        cache: "no-store",
      }).catch((err) => {
        console.error(`[pingRevalidate:${target}] ${path} failed:`, err);
      })
    )
  );
}

export async function pingBoth(siteePaths: string[], ticketsPaths: string[]) {
  await Promise.all([
    pingRevalidate("site", siteePaths),
    pingRevalidate("tickets", ticketsPaths),
  ]);
}
