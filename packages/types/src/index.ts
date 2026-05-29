// Auto-generated database types are in ./database.ts and re-exported below.
// Manual type definitions follow further down.

export type { Database, Json } from "./database";
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
  "scanner",
  "door_sales",
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
  "scanner",
  "door_sales",
  "team_member",
  "manager",
  "admin",
  "super_admin",
];
export type StaffRole = Exclude<UserRole, "buyer">;

/** Role hierarchy — higher number = more permissions */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  buyer: 0,
  scanner: 1,
  door_sales: 2,
  team_member: 3,
  manager: 4,
  admin: 5,
  super_admin: 6,
};

/* -------------------------------------------------------------------------- */
/*                          Admin modules + permissions                       */
/* -------------------------------------------------------------------------- */
// Single source of truth for which role can do what in the admin app.
// Drives sidebar visibility (read), server-action guards (any CRUD action),
// and client-side button gating via the useCan() hook. A `null` cell means
// "this action is not available on this module" (e.g. dashboard has no create).

export const ADMIN_MODULES = [
  "dashboard",
  "reports",
  "reports.marketing",
  "reports.ops",
  "reports.visitors",
  "reports.finance",
  "reports.hr",
  "reports.it",
  "events",
  "orders",
  "doorSale",
  "scan",
  "news",
  "newsletters",
  "funnels",
  "applications",
  "jobOffers",
  "contacts",
  "team",
  "staff",
  "companyInfo",
  "testimonials",
  "legalPages",
  "settings",
  "settings.appSecrets",
  "ads",
  "auditLog",
  "devInfo",
  "emailPreviews",
] as const;
export type AdminModule = (typeof ADMIN_MODULES)[number];

export const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;
export type CrudAction = (typeof CRUD_ACTIONS)[number];

export const PERMISSIONS: Record<
  AdminModule,
  Record<CrudAction, UserRole | null>
> = {
  dashboard:             { read: "scanner",     create: null,         update: null,        delete: null         },
  reports:               { read: "manager",     create: null,         update: null,        delete: null         },
  "reports.marketing":   { read: "manager",     create: null,         update: null,        delete: null         },
  "reports.ops":         { read: "manager",     create: null,         update: null,        delete: null         },
  "reports.visitors":    { read: "manager",     create: null,         update: null,        delete: null         },
  "reports.finance":     { read: "admin",       create: null,         update: null,        delete: null         },
  "reports.hr":          { read: "admin",       create: null,         update: null,        delete: null         },
  "reports.it":          { read: "admin",       create: null,         update: null,        delete: null         },
  events:                { read: "team_member", create: "manager",    update: "manager",   delete: "admin"      },
  orders:                { read: "team_member", create: "door_sales", update: "manager",   delete: "admin"      },
  doorSale:              { read: "door_sales",  create: "door_sales", update: null,        delete: null         },
  scan:                  { read: "scanner",     create: "scanner",    update: null,        delete: null         },
  news:                  { read: "manager",     create: "manager",    update: "manager",   delete: "admin"      },
  newsletters:           { read: "manager",     create: "manager",    update: "manager",   delete: "admin"      },
  funnels:               { read: "manager",     create: "manager",    update: "manager",   delete: "admin"      },
  applications:          { read: "manager",     create: null,         update: "manager",   delete: "admin"      },
  jobOffers:             { read: "admin",       create: "admin",      update: "admin",     delete: "admin"      },
  contacts:              { read: "manager",     create: "manager",    update: "manager",   delete: "admin"      },
  team:                  { read: "manager",     create: "admin",      update: "admin",     delete: "admin"      },
  staff:                 { read: "admin",       create: "admin",      update: "admin",     delete: "admin"      },
  companyInfo:           { read: "admin",       create: "admin",      update: "admin",     delete: "super_admin" },
  testimonials:          { read: "manager",     create: "manager",    update: "manager",   delete: "admin"      },
  legalPages:            { read: "admin",       create: "admin",      update: "admin",     delete: "super_admin" },
  settings:              { read: "admin",       create: "admin",      update: "admin",     delete: "super_admin" },
  "settings.appSecrets": { read: "super_admin", create: "super_admin", update: "super_admin", delete: "super_admin" },
  ads:                   { read: "admin",       create: "admin",      update: "admin",     delete: "admin"      },
  auditLog:              { read: "super_admin", create: null,         update: null,        delete: null         },
  devInfo:               { read: "super_admin", create: null,         update: null,        delete: null         },
  emailPreviews:         { read: "super_admin", create: "super_admin", update: null,        delete: null         },
};

/** Returns true when `role` meets the minimum required for this module/action.
 *  Returns false when the action is `null` in the matrix (= not available). */
export function canDo(
  role: UserRole,
  mod: AdminModule,
  action: CrudAction,
): boolean {
  const required = PERMISSIONS[mod][action];
  if (required === null) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
}

/* -------------------------------------------------------------------------- */
/*                                  Events                                    */
/* -------------------------------------------------------------------------- */

export const EVENT_TYPE_VALUES = ["conference", "masterclass"] as const;
export type EventType = (typeof EVENT_TYPE_VALUES)[number];

// Which DBC branch owns an event. DBC Germany events use our admin + checkout
// stack end-to-end. "Other" branches run their events on their own infra;
// we surface their cards in our listings but click out to their URL in a
// new tab. Mirrors the events.event_branch column
// (supabase/migrations/20260514000001_events_external_branch.sql).
export const EVENT_BRANCH_VALUES = ["dbc_germany", "other"] as const;
export type EventBranch = (typeof EVENT_BRANCH_VALUES)[number];

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
/*                              Notifications                                 */
/* -------------------------------------------------------------------------- */
// Admin-facing in-app + email notifications. Every call to notifyAdmins
// must use a value from this list; the fan-out filters recipients through
// notification_preferences (per-user, per-type, per-channel) and falls
// back to NOTIFICATION_DEFAULTS when a user hasn't tuned a given type.

export const NOTIFICATION_TYPE_VALUES = [
  // Revenue / orders
  "new_order",
  "payment_failed",
  "refund_issued",
  "dispute_created",
  "tier_sold_out",
  "low_inventory",
  // Leads / submissions
  "new_application",
  "contact_form_received",
  "newsletter_subscriber",
  "speaker_question",
  // Event operations
  "check_in_milestone",
  "waitlist_available",
  "admin_event_reminder",
  "door_sale",
  "transfer",
  // Digest
  "daily_digest",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE_VALUES)[number];

/**
 * Default delivery when a user hasn't tuned a given notification type.
 * Tuned to "things a busy operator genuinely needs to see" — not every
 * type shouts in-app, and only the revenue-critical ones email by
 * default. Users can flip any of these in their Preferences tab.
 */
export const NOTIFICATION_DEFAULTS: Record<
  NotificationType,
  { in_app: boolean; email: boolean }
> = {
  new_order:             { in_app: true,  email: true  },
  payment_failed:        { in_app: true,  email: true  },
  refund_issued:         { in_app: true,  email: false },
  dispute_created:       { in_app: true,  email: true  },
  tier_sold_out:         { in_app: true,  email: true  },
  low_inventory:         { in_app: true,  email: false },
  new_application:       { in_app: true,  email: true  },
  contact_form_received: { in_app: true,  email: true  },
  newsletter_subscriber: { in_app: false, email: false },
  speaker_question:      { in_app: true,  email: false },
  check_in_milestone:    { in_app: true,  email: false },
  waitlist_available:    { in_app: true,  email: false },
  admin_event_reminder:  { in_app: true,  email: true  },
  door_sale:             { in_app: true,  email: false },
  transfer:              { in_app: false, email: false },
  daily_digest:          { in_app: false, email: true  },
};

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
/*                         About page (company_info)                          */
/* -------------------------------------------------------------------------- */
// Optional content blocks that the /about page renders when present.
// Stored as JSONB in public.company_info.about_sections_{en,de,fr} (see
// migration 20260429000008_about_content.sql). The existing hardcoded
// hero / founder / locations copy stays in i18n JSON for this ship; this
// type only covers the newer admin-editable sections.

export interface AboutSections {
  /** Short mission block. Appears after the hero + founder. */
  mission?: { title: string; body: string };
  /** Expanded company story. Appears after the proof numbers. */
  story?: { title: string; body: string };
  /** 3–5 value cards. */
  values?: {
    title?: string;
    items: { title: string; desc: string }[];
  };
  /** Objective numbers tiles — e.g. "900 seats", "14 countries". */
  metrics?: {
    items: { value: string; label: string }[];
  };
  /** Press / partner logo strip. Optional — renders only when populated. */
  press?: {
    title?: string;
    logos: { name: string; logoUrl: string; href?: string }[];
  };
  /** Bottom-of-page CTA band. Defaults to "Meet the team" → /team. */
  finalCta?: {
    title: string;
    subtitle?: string;
    primaryCta: string;
    primaryCtaHref: string;
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

// Subset of INVOLVEMENT_ROLES surfaced in the contact-list "Event role"
// filter. Identity-flavoured roles (sponsor/partner/press) are filtered
// via the Category dropdown instead — they're durable identities, not
// event-bound actions. Backfill migration 20260513000005 ensures legacy
// rows are also reachable via Category. `attendee` is intentionally
// excluded — the dedicated Attendees tab covers that audience, so it
// would only duplicate rows in the main Contacts list.
export const EVENT_ROLE_FILTER_VALUES = [
  "invited_guest",
  "speaker",
  "moderator",
  "volunteer",
  "staff",
  "contractor",
  "vip",
] as const;
export type EventRoleFilterValue = (typeof EVENT_ROLE_FILTER_VALUES)[number];

// Category slugs hidden from the contact-list Category filter because
// they overlap with event-bound state (people with a paid order or an
// invite are better discovered via the Event filter / Attendees tab).
export const CONTACT_FILTER_HIDDEN_CATEGORY_SLUGS = [
  "event_attendees",
  "invited_guests",
] as const;

/* -------------------------------------------------------------------------- */
/*                          Per-user pipeline status                          */
/* -------------------------------------------------------------------------- */
// Mirrors the public.pipeline_status Postgres enum
// (supabase/migrations/20260513000004_contact_user_state.sql).
// Stored as English-only tokens; user-facing labels live in i18n under
// admin.contacts.pipeline.statuses.

export const PIPELINE_STATUS_VALUES = [
  "new",
  "engaged",
  "considering",
  "declined",
] as const;
export type PipelineStatus = (typeof PIPELINE_STATUS_VALUES)[number];

// Best-contact-method tokens for the business fields on contacts.
// Stored as English-only tokens; labels resolved via i18n
// admin.contacts.business.bestContactMethods.
export const BEST_CONTACT_METHODS = [
  "email",
  "phone",
  "linkedin",
  "in_person",
  "whatsapp",
  "instagram",
  "web_form",
] as const;
export type BestContactMethod = (typeof BEST_CONTACT_METHODS)[number];

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
  "affiliate",
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
/*                       Program / runsheet (SSOT)                            */
/* -------------------------------------------------------------------------- */
// One table backs both the public-facing event agenda AND the internal day-of
// run-sheet (see supabase/migrations/20260525000001_unify_program_ssot.sql).
// `is_public` toggles per row. event_schedule_items is now a VIEW of the
// same table filtered to is_public=true.

export interface ProgramItemOwnerSpeaker {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  title_en: string | null;
  title_de: string | null;
  title_fr: string | null;
}

export interface ProgramItemOwnerTeamMember {
  id: string;
  slug: string;
  name: string;
  photo_url: string | null;
  role_en: string | null;
  role_de: string | null;
  role_fr: string | null;
}

export interface ProgramItemOwnerContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

/** Display string for a contact-as-owner: "First Last" if available, else email. */
export function contactDisplayName(c: ProgramItemOwnerContact): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || c.email;
}

export interface ProgramItem {
  id: string;
  event_id: string;
  /** EN title — required. */
  title: string;
  title_de: string | null;
  title_fr: string | null;
  /** EN public description — shown on the marketing site and attendee PDF. */
  description: string | null;
  description_de: string | null;
  description_fr: string | null;
  /** Internal team-only notes. Never rendered on public agenda or attendee PDF. */
  notes: string | null;
  starts_at: string;
  ends_at: string | null;
  location_note: string | null;
  responsible_person: string | null;
  /** When true, item is on the public agenda (marketing site + attendee PDF). */
  is_public: boolean;
  status: string;
  sort_order: number;
  default_duration_minutes: number | null;
  /** Auth-user FK for status-update permissions (separate from canonical owner). */
  assigned_to: string | null;
  /** Canonical owner — exactly one of these three should be set, or none. */
  speaker_id: string | null;
  team_member_id: string | null;
  contact_id: string | null;
  /** Legacy inline-speaker fields kept for back-compat (prefer speaker_id). */
  speaker_first_name: string | null;
  speaker_last_name: string | null;
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined records (populated by getProgramItems / getRunsheetItems)
  speaker?: ProgramItemOwnerSpeaker | null;
  team_member?: ProgramItemOwnerTeamMember | null;
  contact?: ProgramItemOwnerContact | null;
  assignee?: { display_name: string | null } | null;
}

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
