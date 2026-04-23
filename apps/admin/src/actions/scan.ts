"use server";

import { createServerClient, notifyAdmins, requireRole } from "@dbc/supabase/server";

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
  alreadyCheckedInAt?: string;
  alreadyCheckedInBy?: string;
  error?: string;
}

/**
 * Checks in a ticket by its QR token via the atomic check_in_ticket() RPC.
 * Prevents double scans through a single SQL UPDATE with WHERE checked_in_at IS NULL.
 */
export async function checkInTicket(
  ticketToken: string,
  eventId: string
): Promise<ScanResult> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  // Validate token looks like a UUID (prevent injection)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(ticketToken.trim())) {
    return { success: false, error: "Invalid ticket code" };
  }

  const { data, error } = await supabase.rpc("check_in_ticket", {
    p_ticket_token: ticketToken.trim(),
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
      tierName: row.tier_name,
    };
  }

  // Already scanned or wrong event
  return {
    success: false,
    attendeeName: row.attendee_name,
    attendeeEmail: row.attendee_email,
    tierName: row.tier_name,
    alreadyCheckedInAt: row.already_checked_in_at,
    alreadyCheckedInBy: row.already_checked_in_by ?? "Unknown staff",
  };
}

export async function getScanStats(eventId: string) {
  await requireRole("team_member");
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
}

export async function getAssignedEvents() {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  // Managers+ see all events; team_members see only assigned events
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
