"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { captureServerError } from "@/lib/observe";

export interface EventStaffRow {
  staffId: string;
  displayName: string | null;
  role: string;
  assignedAt: string;
}

/**
 * Returns staff (DBC team / scanners / managers / admins) assigned to a
 * specific event via the staff_event_assignments link table. Lighter than
 * the global /staff page — no auth.admin lookup, no email exposure —
 * because event-level coverage views only need to answer "who is on duty
 * for this event?".
 */
export async function getEventStaff(eventId: string): Promise<EventStaffRow[]> {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("staff_event_assignments")
    .select(
      `staff_id, created_at,
       profile:profiles!staff_event_assignments_staff_id_fkey(id, display_name, role)`
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    captureServerError(new Error(error.message), {
      scope: "event-staff:getEventStaff",
      data: { event_id: eventId, code: error.code },
    });
    return [];
  }

  // The PostgREST relationship can come back as object or array
  // depending on schema cache; normalize both.
  type Row = {
    staff_id: string;
    created_at: string;
    profile:
      | { id: string; display_name: string | null; role: string }
      | { id: string; display_name: string | null; role: string }[]
      | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile;
    return {
      staffId: r.staff_id,
      displayName: profile?.display_name ?? null,
      role: profile?.role ?? "unknown",
      assignedAt: r.created_at,
    };
  });
}
