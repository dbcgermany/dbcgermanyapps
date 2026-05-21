// Single source of truth for the per-ticket catering pre-order URL.
//
// A ticket holder is eligible for catering pre-selection when:
//   1. The event has catering_enabled = true; AND
//   2. Either the tier's catering_included = true (paid catering bundle),
//      OR at least one of the holder's active contact_event_involvements
//      roles appears in event.catering_eligible_roles (granted by role).
//
// This mirrors the resolver in packages/supabase/src/ticket-access.ts so the
// email and the public catering form agree on who gets in.

export function computeCateringUrl(opts: {
  cateringEnabled: boolean;
  tierCateringIncluded: boolean;
  eligibleRoles: string[];
  contactRoles: string[];
  ticketToken: string;
  locale: "en" | "de" | "fr";
  ticketsBaseUrl: string;
}): string | null {
  if (!opts.cateringEnabled) return null;
  const granted =
    opts.tierCateringIncluded ||
    opts.contactRoles.some((r) => opts.eligibleRoles.includes(r));
  if (!granted) return null;
  return `${opts.ticketsBaseUrl}/${opts.locale}/tickets/${opts.ticketToken}/catering`;
}
