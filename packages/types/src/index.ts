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

// Job applications share the same triage lifecycle today. Aliased (not
// duplicated) so a future divergence only requires redefining one tuple.
export const JOB_APPLICATION_STATUS_VALUES =
  INCUBATION_APPLICATION_STATUS_VALUES;
export type JobApplicationStatus = IncubationApplicationStatus;

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
