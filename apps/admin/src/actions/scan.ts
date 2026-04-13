"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

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
