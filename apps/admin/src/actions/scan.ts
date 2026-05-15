"use server";

import { createServerClient, notifyAdmins, requireRole } from "@dbc/supabase/server";
import {
  resolveTicketAccess,
  type InvolvementRole,
  type TierRow,
} from "@dbc/supabase";

// Fire a check_in_milestone notification when the event crosses a 25% /
// 50% / 75% / 100% check-in threshold. Idempotent via an audit_log row
// per (event_id, bucket).
const MILESTONES = [25, 50, 75, 100] as const;

async function maybeFireCheckInMilestone(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  eventId: string
) {
  const [{ count: total }, { count: checkedIn }] = await Promise.all([
    // Paid/comped only — milestones should track attendance against
    // actual ticket holders, not abandoned reservations.
    supabase
      .from("tickets")
      .select("*, orders!inner(status)", { count: "exact", head: true })
      .in("orders.status", ["paid", "comped"])
      .eq("event_id", eventId),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .not("checked_in_at", "is", null),
  ]);
  const t = total ?? 0;
  const c = checkedIn ?? 0;
  if (t === 0) return;
  const percent = Math.floor((c / t) * 100);
  const bucket = MILESTONES.filter((m) => percent >= m).pop();
  if (!bucket) return;

  const { count: already } = await supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("action", "notify_check_in_milestone")
    .eq("entity_id", eventId)
    .filter("details->>bucket", "eq", String(bucket));
  if ((already ?? 0) > 0) return;

  const { data: event } = await supabase
    .from("events")
    .select("title_en")
    .eq("id", eventId)
    .maybeSingle();

  await notifyAdmins(supabase, {
    type: "check_in_milestone",
    title: `${bucket}% checked in · ${event?.title_en ?? "Event"}`,
    body: `${c} of ${t} attendees are in the room.`,
    data: { event_id: eventId, percent: bucket, checked_in: c, total: t },
  });

  await supabase.from("audit_log").insert({
    action: "notify_check_in_milestone",
    entity_type: "events",
    entity_id: eventId,
    details: { bucket: String(bucket), checked_in: c, total: t },
  });
}

export interface ScanResult {
  success: boolean;
  attendeeName?: string;
  attendeeEmail?: string;
  tierName?: string;
  tierBadgeLabel?: string | null;
  tierPurpose?: string | null;
  isTeam?: boolean;
  isCompanion?: boolean;
  /** Display price for the tier (or reference tier for companions) in minor units. */
  tierPriceCents?: number;
  tierCurrency?: string;
  /** True when the resolver grants catering (tier, role, or override). */
  cateringIncluded?: boolean;
  /** Set on companion tickets when an event-level reference tier is configured. */
  referenceTier?: { name: string; priceCents: number; currency: string } | null;
  alreadyCheckedInAt?: string;
  alreadyCheckedInBy?: string;
  error?: string;
}

/**
 * Checks in a ticket by its QR token via the atomic check_in_ticket() RPC.
 * Prevents double scans through a single SQL UPDATE with WHERE checked_in_at IS NULL.
 *
 * Never throws — auth/env/RPC failures are funnelled into a ScanResult so
 * the scanner UI can keep running across a live event without tripping the
 * route error boundary.
 */
export async function checkInTicket(
  ticketToken: string,
  eventId: string
): Promise<ScanResult> {
  try {
    const user = await requireRole("scanner");
    const supabase = await createServerClient();

    // Validate token looks like a UUID (prevent injection). The two QR types
    // we generate are intentionally non-overlapping: ticket QRs encode a bare
    // UUID token; the per-event "share" QR (admin event detail page) encodes
    // a public URL. If someone scans the share QR with the door scanner we
    // surface a specific error so they don't think the ticket is broken.
    const trimmed = ticketToken.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return {
        success: false,
        error: "This is the public event link, not a ticket. Scan the QR from the customer's email or PDF ticket.",
      };
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmed)) {
      return { success: false, error: "Invalid ticket code" };
    }

    // Revocation gate — chapter delegate / staff lifecycle can flag a
    // ticket as revoked. The check_in_ticket RPC doesn't know about this
    // column, so we pre-check here before claiming the seat.
    const { data: ticketStatus } = await supabase
      .from("tickets")
      .select(
        "id, revoked_at, revocation_reason, tier_id, contact_id, event_id, catering_eligible_override, ticket_tiers:ticket_tiers(id, scanner_badge_label, purpose, is_team, is_companion, name_en, name_de, name_fr, price_cents, currency, catering_included), events:events(chapter_companion_value_tier_id, catering_eligible_roles)"
      )
      .eq("ticket_token", trimmed)
      .maybeSingle();
    if (ticketStatus?.revoked_at) {
      return {
        success: false,
        error:
          ticketStatus.revocation_reason
            ? `Ticket revoked: ${ticketStatus.revocation_reason}`
            : "Ticket revoked",
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issuedTier = ((ticketStatus as any)?.ticket_tiers ?? null) as TierRow | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventRow = ((ticketStatus as any)?.events ?? null) as {
      chapter_companion_value_tier_id: string | null;
      catering_eligible_roles: InvolvementRole[] | null;
    } | null;

    // Pull the reference tier when companion + per-event override is set.
    let referenceTier: TierRow | null = null;
    if (issuedTier?.is_companion && eventRow?.chapter_companion_value_tier_id) {
      const { data: refTier } = await supabase
        .from("ticket_tiers")
        .select(
          "id, name_en, name_de, name_fr, price_cents, currency, scanner_badge_label, purpose, is_team, is_companion, catering_included"
        )
        .eq("id", eventRow.chapter_companion_value_tier_id)
        .maybeSingle();
      referenceTier = (refTier as TierRow | null) ?? null;
    }

    // Active roles for this contact on this event — drives role-based catering.
    let activeRoles: InvolvementRole[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contactId = (ticketStatus as any)?.contact_id as string | null;
    if (contactId && eventRow) {
      const { data: involvements } = await supabase
        .from("contact_event_involvements")
        .select("role, status")
        .eq("contact_id", contactId)
        .eq("event_id", eventId);
      activeRoles = ((involvements ?? []) as { role: string; status: string | null }[])
        .filter((i) => i.status === "active" || i.status === null)
        .map((i) => i.role as InvolvementRole);
    }

    const access = resolveTicketAccess({
      locale: "en",
      issuedTier,
      event: {
        chapter_companion_value_tier_id: eventRow?.chapter_companion_value_tier_id ?? null,
        catering_eligible_roles: eventRow?.catering_eligible_roles ?? [],
      },
      referenceTier,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cateringOverride: (ticketStatus as any)?.catering_eligible_override ?? null,
      activeRoles,
    });

    const { data, error } = await supabase.rpc("check_in_ticket", {
      p_ticket_token: trimmed,
      p_event_id: eventId,
      p_staff_id: user.userId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Ticket not found" };
    }

    const row = data[0];

    if (row.success) {
      await supabase.from("audit_log").insert({
        user_id: user.userId,
        action: "check_in_ticket",
        entity_type: "tickets",
        entity_id: row.ticket_id,
        details: { attendee: row.attendee_name, event_id: eventId },
      });

      // Fire-and-forget: don't slow down the scanner response.
      maybeFireCheckInMilestone(supabase, eventId).catch((err) => {
        console.error("[scan] check-in milestone check failed:", err);
      });

      return {
        success: true,
        attendeeName: row.attendee_name,
        attendeeEmail: row.attendee_email,
        tierName: access.displayTierName || row.tier_name,
        tierBadgeLabel: access.scannerBadgeLabel,
        tierPurpose: access.purpose,
        isTeam: access.isTeam,
        isCompanion: access.isCompanion,
        tierPriceCents: access.displayPriceCents,
        tierCurrency: access.currency,
        cateringIncluded: access.cateringIncluded,
        referenceTier: access.referenceTier,
      };
    }

    // Already scanned or wrong event
    return {
      success: false,
      attendeeName: row.attendee_name,
      attendeeEmail: row.attendee_email,
      tierName: access.displayTierName || row.tier_name,
      tierBadgeLabel: access.scannerBadgeLabel,
      tierPurpose: access.purpose,
      isTeam: access.isTeam,
      isCompanion: access.isCompanion,
      tierPriceCents: access.displayPriceCents,
      tierCurrency: access.currency,
      cateringIncluded: access.cateringIncluded,
      referenceTier: access.referenceTier,
      alreadyCheckedInAt: row.already_checked_in_at,
      alreadyCheckedInBy: row.already_checked_in_by ?? "Unknown staff",
    };
  } catch (err) {
    console.error("[scan] checkInTicket failed:", err);
    return { success: false, error: "scan_failed" };
  }
}

export async function getScanStats(
  eventId: string
): Promise<{ total: number; checkedIn: number }> {
  try {
    await requireRole("scanner");
    const supabase = await createServerClient();

    const { count: total } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    const { count: checkedIn } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .not("checked_in_at", "is", null);

    return { total: total ?? 0, checkedIn: checkedIn ?? 0 };
  } catch (err) {
    console.error("[scan] getScanStats failed:", err);
    return { total: 0, checkedIn: 0 };
  }
}

export async function getAssignedEvents() {
  const user = await requireRole("scanner");
  const supabase = await createServerClient();

  // team_member is the only role restricted to assigned events. scanner and
  // door_sales are global by design (they work whichever event needs them);
  // manager+ obviously see everything.
  if (user.role === "team_member") {
    const { data } = await supabase
      .from("staff_event_assignments")
      .select("event_id, events(id, title_en, title_de, title_fr, starts_at, venue_name)")
      .eq("staff_id", user.userId);

    return (data ?? []).map((row) => row.events).filter(Boolean);
  }

  const { data } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at, venue_name")
    .gte("ends_at", new Date(Date.now() - 86400000).toISOString()) // events ending within last day or future
    .order("starts_at", { ascending: true });

  return data ?? [];
}
