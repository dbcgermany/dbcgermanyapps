import type { AffiliateLocale } from "./types";

function ticketsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
}

// PUBLIC referral link — what the affiliate shares with their audience.
// Tags the source so the webhook can attribute the conversion. If a coupon
// code is also configured for this enrollment, it's added so the buyer gets
// the discount automatically — but the affiliate still earns their commission
// without one.
export function buildReferralUrl(opts: {
  locale: AffiliateLocale;
  eventSlug: string;
  trackingTag: string;
  couponCode?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("src", `aff_${opts.trackingTag}`);
  if (opts.couponCode) {
    params.set("code", opts.couponCode);
  }
  return `${ticketsBaseUrl()}/${opts.locale}/checkout/${opts.eventSlug}?${params.toString()}`;
}

// PRIVATE dashboard link — only the affiliate should ever see this URL.
// Long unguessable token is the entire credential.
export function buildDashboardUrl(opts: {
  locale: AffiliateLocale;
  token: string;
}): string {
  return `${ticketsBaseUrl()}/${opts.locale}/partner/${opts.token}`;
}
