/**
 * Pure formatting helpers shared between server and client components.
 *
 * Lives here (not in actions/) so it can be imported from a "use server"
 * module without the async-only-exports constraint, and from client
 * components without paying a server-roundtrip for cheap math.
 */

export function formatCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale || "en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function pctChange(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100;
  return ((current - prior) / prior) * 100;
}

export function deltaVsPrior(
  current: number,
  prior: number
): { pct: number; direction: "up" | "down" | "flat" } {
  const pct = pctChange(current, prior);
  const direction =
    Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
  return { pct, direction };
}
