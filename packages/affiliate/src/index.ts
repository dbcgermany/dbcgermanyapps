// Browser/edge-safe exports.
export { affiliateEnabled } from "./feature-flag";
export { buildReferralUrl, buildDashboardUrl } from "./urls";
export { generateDashboardToken, generateTrackingTag } from "./token";
export type {
  Affiliate,
  AffiliateInsert,
  AffiliateUpdate,
  EventAffiliate,
  EventAffiliateInsert,
  EventAffiliateUpdate,
  AffiliateReferral,
  AffiliateCommission,
  AffiliatePayout,
  AffiliateStatus,
  EventAffiliateStatus,
  CommissionStatus,
  PayoutStatus,
  AffiliateLocale,
  DashboardData,
} from "./types";
