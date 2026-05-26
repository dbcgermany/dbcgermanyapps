import type { AffiliateLocale } from "./types";

function ticketsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
}

// PUBLIC referral link — what the affiliate shares with their audience.
// Pre-applies their coupon code and tags the source for analytics.
export function buildReferralUrl(opts: {
  locale: AffiliateLocale;
  eventSlug: string;
  couponCode: string;
  trackingTag?: string;
}): string {
  const params = new URLSearchParams();
  params.set("code", opts.couponCode);
  if (opts.trackingTag) {
    params.set("src", `aff_${opts.trackingTag}`);
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
