// Shared, pure helpers for resolving what a ticket actually grants at the door:
// tier display name, value (€), catering eligibility, badge — including the
// chapter-delegate +1 dynamic "reference tier" override and the per-event
// role-based catering grants.
//
// This file has no I/O — callers fetch the rows they need from Supabase and
// pass them in. That keeps the helper trivially importable from any app
// (admin, tickets) without dragging server-only deps along.

export type InvolvementRole =
  | "attendee"
  | "invited_guest"
  | "speaker"
  | "moderator"
  | "sponsor"
  | "partner"
  | "contractor"
  | "volunteer"
  | "staff"
  | "press"
  | "vip"
  | "chapter_delegate"
  | "delegate_companion"
  | "team_member_de"
  | "team_member_external"
  | "institutional_guest";

export const ALL_INVOLVEMENT_ROLES: InvolvementRole[] = [
  "speaker",
  "moderator",
  "sponsor",
  "vip",
  "institutional_guest",
  "team_member_de",
  "team_member_external",
  "chapter_delegate",
  "delegate_companion",
  "partner",
  "press",
  "staff",
  "volunteer",
  "contractor",
  "invited_guest",
  "attendee",
];

export const ROLE_LABELS: Record<InvolvementRole, string> = {
  speaker: "Speaker",
  moderator: "Moderator / Host",
  sponsor: "Sponsor",
  vip: "VIP",
  institutional_guest: "Institutional guest",
  team_member_de: "DBC Germany team",
  team_member_external: "DBC international team",
  chapter_delegate: "Chapter delegate",
  delegate_companion: "Delegate companion (+1)",
  partner: "Partner",
  press: "Press",
  staff: "Staff",
  volunteer: "Volunteer",
  contractor: "Contractor",
  invited_guest: "Invited guest",
  attendee: "Attendee",
};

export type TierRow = {
  id: string;
  name_en: string | null;
  name_de: string | null;
  name_fr: string | null;
  price_cents: number | null;
  currency: string | null;
  scanner_badge_label: string | null;
  purpose: string | null;
  is_team: boolean | null;
  is_companion: boolean | null;
  catering_included: boolean | null;
};

export type EventAccessRow = {
  chapter_companion_value_tier_id: string | null;
  catering_eligible_roles: InvolvementRole[] | null;
};

export type ResolveArgs = {
  locale: "en" | "de" | "fr";
  issuedTier: TierRow | null;
  event: EventAccessRow;
  /** The reference tier row pointed at by event.chapter_companion_value_tier_id; null if not configured. */
  referenceTier: TierRow | null;
  /** The ticket holder's per-ticket override, if any. */
  cateringOverride: boolean | null;
  /** Active involvement_role values for this contact on this event. */
  activeRoles: InvolvementRole[];
};

export type TicketAccessView = {
  displayTierName: string;
  displayPriceCents: number;
  currency: string;
  cateringIncluded: boolean;
  cateringGrantedByRole: InvolvementRole | null;
  scannerBadgeLabel: string | null;
  isCompanion: boolean;
  isTeam: boolean;
  purpose: string | null;
  referenceTier: {
    name: string;
    priceCents: number;
    currency: string;
  } | null;
};

function localizedName(tier: TierRow | null, locale: "en" | "de" | "fr"): string {
  if (!tier) return "";
  const key = `name_${locale}` as "name_en" | "name_de" | "name_fr";
  return tier[key] || tier.name_en || tier.name_de || tier.name_fr || "";
}

export function resolveTicketAccess(args: ResolveArgs): TicketAccessView {
  const { locale, issuedTier, event, referenceTier, cateringOverride, activeRoles } = args;

  const isCompanion = !!issuedTier?.is_companion;
  const hasReference = !!referenceTier && !!event.chapter_companion_value_tier_id;
  const effective: TierRow | null = isCompanion && hasReference ? referenceTier : issuedTier;

  const displayTierName = localizedName(effective, locale);
  const displayPriceCents = effective?.price_cents ?? 0;
  const currency = effective?.currency ?? "EUR";

  const eligibleRoles = event.catering_eligible_roles ?? [];
  const roleGrant = activeRoles.find((r) => eligibleRoles.includes(r)) ?? null;

  const tierCatering = !!effective?.catering_included;
  let cateringIncluded: boolean;
  if (cateringOverride === true) {
    cateringIncluded = true;
  } else if (cateringOverride === false) {
    cateringIncluded = false;
  } else {
    cateringIncluded = tierCatering || roleGrant !== null;
  }

  let scannerBadgeLabel: string | null = issuedTier?.scanner_badge_label ?? null;
  if (isCompanion && hasReference && referenceTier) {
    const refName = localizedName(referenceTier, locale);
    scannerBadgeLabel = refName
      ? `COMPANION (access: ${refName.toUpperCase()})`
      : scannerBadgeLabel;
  }

  return {
    displayTierName,
    displayPriceCents,
    currency,
    cateringIncluded,
    cateringGrantedByRole: cateringOverride === null && !tierCatering ? roleGrant : null,
    scannerBadgeLabel,
    isCompanion,
    isTeam: !!issuedTier?.is_team,
    purpose: issuedTier?.purpose ?? null,
    referenceTier:
      isCompanion && hasReference && referenceTier
        ? {
            name: localizedName(referenceTier, locale),
            priceCents: referenceTier.price_cents ?? 0,
            currency: referenceTier.currency ?? "EUR",
          }
        : null,
  };
}

/**
 * Locale-aware price formatter. €-symbol position differs between de-DE
 * ("12,34 €") and en-US/en-IE conventions; this honors the user's locale.
 */
export function formatPrice(
  priceCents: number,
  currency: string,
  locale: "en" | "de" | "fr"
): string {
  const tag = locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-IE";
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency || "EUR"}`;
  }
}
