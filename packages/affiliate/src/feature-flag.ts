// Single feature flag for the whole affiliate program. Read from env so it
// can be toggled per environment without code changes. Defaults to true so a
// missing env var doesn't accidentally disable the feature; set
// AFFILIATE_ENABLED=false to kill the system globally (webhook hooks no-op,
// dashboard route 404s, admin menu items hide, cron no-ops).
//
// NEXT_PUBLIC_AFFILIATE_ENABLED is the client-side variant; set both to the
// same value so server + client behave consistently.

export function affiliateEnabled(): boolean {
  const value =
    process.env.AFFILIATE_ENABLED ??
    process.env.NEXT_PUBLIC_AFFILIATE_ENABLED;
  if (value === undefined) return true;
  return value !== "false" && value !== "0";
}
