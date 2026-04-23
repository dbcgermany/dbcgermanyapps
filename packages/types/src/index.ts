// Auto-generated database types will be in ./database.ts
// Manual type definitions below.
//
// Every union type in this file is derived from a `*_VALUES` readonly
// tuple so the TS type and the runtime value list stay locked together.
// UI forms `.map()` over the tuple; server actions type-check comparisons
// against the union. No magic-string duplicates anywhere else in the repo.

/* -------------------------------------------------------------------------- */
/*                                User roles                                  */
/* -------------------------------------------------------------------------- */

export const USER_ROLE_VALUES = [
  "buyer",
  "team_member",
  "manager",
  "admin",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];

/**
 * Every role with dashboard access — i.e. everyone except "buyer".
 * Used by queries that need "all staff" (e.g. link-to-staff-account
 * dropdowns, notification fan-out, admin directories). Typed as
 * `readonly UserRole[]` (not `StaffRole[]`) so call sites can pass
 * a general UserRole to `.includes(role)` without a cast.
 */
export const STAFF_ROLES: readonly UserRole[] = [
  "team_member",
  "manager",
  "admin",
  "super_admin",
];
export type StaffRole = Exclude<UserRole, "buyer">;

/** Role hierarchy — higher number = more permissions */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  buyer: 0,
  team_member: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

/* -------------------------------------------------------------------------- */
/*                                  Events                                    */
/* -------------------------------------------------------------------------- */

export const EVENT_TYPE_VALUES = ["conference", "masterclass"] as const;
export type EventType = (typeof EVENT_TYPE_VALUES)[number];

export const EVENT_MEDIA_TYPE_VALUES = ["photo", "video", "link"] as const;
export type EventMediaType = (typeof EVENT_MEDIA_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/*                           Orders / payments                                */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_VALUES = [
  "pending",
  "paid",
  "comped",
  "refunded",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ACQUISITION_TYPE_VALUES = [
  "purchased",
  "invited",
  "assigned",
  "door_sale",
] as const;
export type AcquisitionType = (typeof ACQUISITION_TYPE_VALUES)[number];

export const PAYMENT_METHOD_VALUES = [
  "card",
  "sepa",
  "paypal",
  "cash",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

/**
 * Canonical Stripe Checkout `payment_method_types` values (pinned API
 * 2026-03-25.dahlia). Used by `events.enabled_payment_methods` to
 * whitelist the methods offered for that event. Values MUST match
 * Stripe's exact spelling — `sepa_debit` not `sepa`, `amazon_pay` not
 * `amazonpay`, etc. — or Stripe rejects the Checkout Session with
 * `parameter_unknown`.
 *
 * An empty `enabled_payment_methods` array means "no whitelist —
 * use the account's default payment method configuration", which is
 * the recommended setting (operators toggle methods on/off in the
 * Stripe Dashboard, no code change needed).
 *
 * Apple Pay / Google Pay aren't listed here: Stripe surfaces them
 * automatically when `card` is enabled and the visitor's device
 * supports them.
 */
export const STRIPE_PAYMENT_METHOD_TYPE_VALUES = [
  "card",
  "sepa_debit",
  "paypal",
  "klarna",
  "link",
  "bancontact",
  "eps",
  "ideal",
  "amazon_pay",
  "mb_way",
] as const;
export type StripePaymentMethodType =
  (typeof STRIPE_PAYMENT_METHOD_TYPE_VALUES)[number];

export const DISCOUNT_TYPE_VALUES = ["percentage", "fixed_amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/*                                  Team                                      */
/* -------------------------------------------------------------------------- */

export const TEAM_MEMBER_VISIBILITY_VALUES = [
  "public",
  "internal",
  "hidden",
] as const;
export type TeamMemberVisibility =
  (typeof TEAM_MEMBER_VISIBILITY_VALUES)[number];

/* -------------------------------------------------------------------------- */
/*                              Applications                                  */
/* -------------------------------------------------------------------------- */

export const INCUBATION_APPLICATION_STATUS_VALUES = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "accepted",
] as const;
export type IncubationApplicationStatus =
  (typeof INCUBATION_APPLICATION_STATUS_VALUES)[number];

// Job applications share the same 5-state triage lifecycle but have their
// own DB enum (job_application_status) so future divergence is local.
export const JOB_APPLICATION_STATUS_VALUES =
  INCUBATION_APPLICATION_STATUS_VALUES;
export type JobApplicationStatus = IncubationApplicationStatus;

/* -------------------------------------------------------------------------- */
/*                      Incubation wizard answer enums                        */
/* -------------------------------------------------------------------------- */
// Mirrors of the CHECK-constrained text columns + text[] option sets on
// public.incubation_applications. See
// supabase/migrations/20260428000001_incubation_wizard_fields.sql.

export const INCUBATION_PROFILE_TYPES = [
  "project_holder",
  "entrepreneur",
  "student",
  "investor",
  "other",
] as const;
export type IncubationProfileType = (typeof INCUBATION_PROFILE_TYPES)[number];

// Broad sector taxonomy — deliberately kept short; "other" + free-text
// fallback captures long-tail. Keep in sync with
// packages/i18n/messages/*.json incubationApply.page4.sectors.*.
export const INCUBATION_INDUSTRY_SECTORS = [
  "tech_digital",
  "agri_food",
  "retail_commerce",
  "creative_media",
  "health_wellness",
  "education",
  "finance",
  "energy_sustainability",
  "manufacturing",
  "services",
  "other",
] as const;
export type IncubationIndustrySector =
  (typeof INCUBATION_INDUSTRY_SECTORS)[number];

// Mirrors the six DBC pillars + consulting/advisory. Applicants can request
// several on page 5 (stored as text[]).
export const INCUBATION_SERVICES = [
  "incubation",
  "courses",
  "investments",
  "mentorship",
  "events",
  "elearning",
  "consulting",
  "other",
] as const;
export type IncubationService = (typeof INCUBATION_SERVICES)[number];

export const INCUBATION_DISCOVERY_CHANNELS = [
  "social_media",
  "event",
  "word_of_mouth",
  "media",
  "other",
] as const;
export type IncubationDiscoveryChannel =
  (typeof INCUBATION_DISCOVERY_CHANNELS)[number];

/* -------------------------------------------------------------------------- */
/*                             Funnel system                                  */
/* -------------------------------------------------------------------------- */
// Mirrors public.funnels + public.funnel_events. See
// supabase/migrations/20260429000001_funnel_system.sql.
//
// One dynamic funnel system — every ad landing page is a row in public.funnels,
// rendered by apps/site/src/app/[locale]/(funnels)/f/[slug]/page.tsx. Content
// blobs are stored per-locale and conform to FunnelContent below.

export const FUNNEL_STATUS_VALUES = [
  "draft",
  "published",
  "archived",
] as const;
export type FunnelStatus = (typeof FUNNEL_STATUS_VALUES)[number];

export const FUNNEL_CTA_TYPES = [
  "external_link",
  "incubation_wizard",
  "contact_form",
] as const;
export type FunnelCtaType = (typeof FUNNEL_CTA_TYPES)[number];

export const FUNNEL_EVENT_TYPES = [
  "view",
  "cta_click",
  "conversion",
] as const;
export type FunnelEventType = (typeof FUNNEL_EVENT_TYPES)[number];

/** Shape admins edit in the funnel form and the dynamic renderer consumes. */
export interface FunnelContent {
  hero: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    primaryCta: string;
  };
  /** Three-beat story arc: the pain the visitor already feels, the cost
   *  of doing nothing, and what this event is. */
  story?: {
    problem: string;
    agitation: string;
    solution: string;
  };
  /** "By the numbers" strip — objective social proof tiles. */
  proof?: {
    items: { value: string; label: string }[];
  };
  benefits?: {
    eyebrow?: string;
    title?: string;
    items: { key: string; title: string; desc: string }[];
  };
  /** Shown below the pricing table — cohort access, post-event WhatsApp,
   *  refund window. The "what's included beyond the ticket." */
  bonus?: {
    title: string;
    items: { title: string; desc: string }[];
  };
  faq?: {
    title: string;
    items: { q: string; a: string }[];
  };
  /** Last-chance closer after the FAQ. Scrolls back to pricing. */
  finalCta?: {
    title: string;
    subtitle?: string;
    primaryCta: string;
  };
  footerCta?: {
    text: string;
    email: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                            Job offers                                      */
/* -------------------------------------------------------------------------- */

export const EMPLOYMENT_TYPE_VALUES = [
  "full_time",
  "part_time",
  "freelance",
  "internship",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/*                             Newsletters                                    */
/* -------------------------------------------------------------------------- */

export const NEWSLETTER_STATUS_VALUES = [
  "draft",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "failed",
] as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUS_VALUES)[number];

export const NEWSLETTER_SEND_STATUS_VALUES = [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "opened",
  "clicked",
  "unsubscribed",
  "failed",
] as const;
export type NewsletterSendStatus =
  (typeof NEWSLETTER_SEND_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/*                                Sponsors                                    */
/* -------------------------------------------------------------------------- */
// Sponsor tier + status are currently free-text columns in the DB (not DB
// enums). The const arrays below are the authoritative TS-side SSOT until
// a real business need pushes us to a DB enum.

export const SPONSOR_TIER_VALUES = [
  "title",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "partner",
  "media",
] as const;
export type SponsorTier = (typeof SPONSOR_TIER_VALUES)[number];

export const SPONSOR_STATUS_VALUES = [
  "lead",
  "proposal",
  "confirmed",
  "active",
  "completed",
] as const;
export type SponsorStatus = (typeof SPONSOR_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/*                          Contact event involvements                        */
/* -------------------------------------------------------------------------- */

export const INVOLVEMENT_ROLES = [
  "attendee",
  "invited_guest",
  "sponsor",
  "partner",
  "contractor",
  "speaker",
  "moderator",
  "volunteer",
  "staff",
  "press",
  "vip",
] as const;
export type InvolvementRole = (typeof INVOLVEMENT_ROLES)[number];

/* -------------------------------------------------------------------------- */
/*                           Contact categories                               */
/* -------------------------------------------------------------------------- */
// Canonical system slugs seeded in
// supabase/migrations/20260416000002_contacts.sql (is_system=true rows).
// Code must never spell these out as magic strings.

export const CONTACT_CATEGORY_SLUGS = [
  "founders",
  "investors",
  "mentors",
  "students",
  "event_attendees",
  "invited_guests",
  "partners",
  "press",
  "diaspora",
  "alumni",
] as const;
export type ContactCategorySlug = (typeof CONTACT_CATEGORY_SLUGS)[number];

/**
 * Named-access object for contact category slugs. Prefer this over string
 * literals in call sites so typos fail the compile (the underlying RPC
 * accepts any text — a typo would be silently dropped at the DB level).
 *
 *   p_auto_category_slug: CONTACT_CATEGORY.founders  // ✓
 *   p_auto_category_slug: "fonders"                  // ✗ silently ignored
 */
export const CONTACT_CATEGORY = Object.fromEntries(
  CONTACT_CATEGORY_SLUGS.map((s) => [s, s])
) as { [K in ContactCategorySlug]: K };

/* -------------------------------------------------------------------------- */
/*                                 Locales                                    */
/* -------------------------------------------------------------------------- */

export const LOCALES = ["en", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/* -------------------------------------------------------------------------- */
/*                            Business-rule defaults                          */
/* -------------------------------------------------------------------------- */
// Defaults are authoritative when the matching env var is unset. Each app
// reads the env var with these as the fallback so the TS fallback never
// drifts from the displayed / enforced limit.

export const DEFAULTS = {
  /** Max completed orders from the same email for a single event. */
  MAX_ORDERS_PER_EMAIL_PER_EVENT: 3,
  /** How long a checkout reservation holds inventory before the sweeper releases it. */
  RESERVATION_TTL_MINUTES: 15,
  /** Max tickets in a single checkout order (admin-configurable per event). */
  MAX_TICKETS_PER_ORDER: 10,
} as const;
