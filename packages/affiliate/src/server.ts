// Server-side exports — these import node-only or db-coupled modules.
export {
  processAffiliateAttribution,
  reverseAffiliateCommissions,
} from "./webhook-hook";
export type { WebhookCtx } from "./webhook-hook";
export {
  createAffiliate,
  updateAffiliate,
  listAffiliates,
  getAffiliate,
  enrollAffiliateInEvent,
  rotateDashboardToken,
  revokeDashboardToken,
  extendTokenExpiry,
  updateEventAffiliate,
  listEventAffiliates,
} from "./server-actions/admin-crud";
export type {
  CreateAffiliateInput,
  EnrollAffiliateInput,
  EnrollAffiliateResult,
} from "./server-actions/admin-crud";
export {
  getAffiliateDashboardByToken,
} from "./server-actions/dashboard";
export type { DashboardResult } from "./server-actions/dashboard";
export { runAffiliateCooldownCron } from "./server-actions/cron";
export type { CronResult } from "./server-actions/cron";
export {
  listEligiblePayoutAggregates,
  createPayoutForAffiliate,
  markPayoutPaid,
  cancelPayout,
  listPayoutsForAffiliate,
} from "./server-actions/payouts";
export type {
  EligibleAggregate,
  CreatePayoutInput,
  CreatePayoutResult,
  MarkPayoutPaidInput,
} from "./server-actions/payouts";
export {
  generateAffiliateStatementPdf,
} from "./pdf/generate-statement";
export type { GenerateStatementInput } from "./pdf/generate-statement";
