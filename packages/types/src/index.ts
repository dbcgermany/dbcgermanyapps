// Auto-generated database types will be in ./database.ts
// Manual type definitions below

export type UserRole = "buyer" | "team_member" | "manager" | "admin" | "super_admin";

export type EventType = "conference" | "masterclass";

export type OrderStatus = "pending" | "paid" | "comped" | "refunded" | "cancelled";

export type AcquisitionType = "purchased" | "invited" | "assigned" | "door_sale";

export type PaymentMethod = "card" | "sepa" | "paypal" | "cash";

export type DiscountType = "percentage" | "fixed_amount";

export type EventMediaType = "photo" | "video" | "link";

export type Locale = "en" | "de" | "fr";

export const LOCALES: Locale[] = ["en", "de", "fr"];

export const DEFAULT_LOCALE: Locale = "en";

/** Role hierarchy — higher number = more permissions */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  buyer: 0,
  team_member: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};
