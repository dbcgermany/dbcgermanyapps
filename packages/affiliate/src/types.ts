import type { Database } from "@dbc/types";

export type Affiliate = Database["public"]["Tables"]["affiliates"]["Row"];
export type AffiliateInsert = Database["public"]["Tables"]["affiliates"]["Insert"];
export type AffiliateUpdate = Database["public"]["Tables"]["affiliates"]["Update"];

export type EventAffiliate = Database["public"]["Tables"]["event_affiliates"]["Row"];
export type EventAffiliateInsert = Database["public"]["Tables"]["event_affiliates"]["Insert"];
export type EventAffiliateUpdate = Database["public"]["Tables"]["event_affiliates"]["Update"];

export type AffiliateReferral = Database["public"]["Tables"]["affiliate_referrals"]["Row"];
export type AffiliateCommission = Database["public"]["Tables"]["affiliate_commissions"]["Row"];
export type AffiliatePayout = Database["public"]["Tables"]["affiliate_payouts"]["Row"];

export type AffiliateStatus = "invited" | "active" | "paused" | "terminated";
export type EventAffiliateStatus = "active" | "paused" | "ended";
export type CommissionStatus =
  | "pending"
  | "eligible"
  | "payout_queued"
  | "paid"
  | "reversed";
export type PayoutStatus = "pending" | "approved" | "paid" | "cancelled";

export type AffiliateLocale = "en" | "de" | "fr";

export interface DashboardData {
  affiliate: Affiliate;
  eventAffiliate: EventAffiliate;
  event: {
    id: string;
    slug: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
  };
  coupon: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  };
  kpis: {
    ticketsSold: number;
    totalEarnedCents: number;
    pendingEligibleCents: number;
    cooldownCents: number;
  };
  recentReferrals: Array<{
    id: string;
    created_at: string;
    commission_cents: number | null;
    status: CommissionStatus | null;
  }>;
  payouts: Array<{
    id: string;
    paid_at: string | null;
    amount_cents: number;
    currency: string;
    payment_reference: string | null;
    statement_storage_path: string | null;
    status: PayoutStatus;
  }>;
  referralUrl: string;
}
