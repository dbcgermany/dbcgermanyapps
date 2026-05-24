"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { INVOLVEMENT_ROLES, type InvolvementRole } from "@dbc/types";
import { captureServerError } from "@/lib/observe";

export interface EventTeamMemberRow {
  id: string;
  contact_id: string;
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  role: InvolvementRole;
  notes: string | null;
  created_at: string;
}

/**
 * Returns people involved in an event in a NON-attendee capacity:
 * organisers, sponsors, partners, contractors, speakers, moderators,
 * volunteers, staff, press, vip.
 *
 * Attendees (= ticket holders, bought or door-sold) and invited_guests
 * intentionally excluded — those live on /events/[id]/attendees and
 * /events/[id]/invitations respectively.
 */
export async function getEventTeamMembers(
  eventId: string
): Promise<EventTeamMemberRow[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  // Everything except ticket-holder-ish roles. We list excluded explicitly
  // rather than filtering by NOT IN so adding a new role later (e.g. "host")
  // gets included automatically.
  const NON_TEAM: ReadonlySet<InvolvementRole> = new Set([
    "attendee",
    "invited_guest",
  ]);
  const teamRoles = INVOLVEMENT_ROLES.filter((r) => !NON_TEAM.has(r));

  const { data, error } = await supabase
    .from("contact_event_involvements")
    .select(
      `id, contact_id, role, notes, created_at,
       contact:contacts!contact_event_involvements_contact_id_fkey(id, first_name, last_name, email, phone)`
    )
    .eq("event_id", eventId)
    .in("role", teamRoles as unknown as string[])
    .order("role", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    captureServerError(new Error(error.message), {
      scope: "event-team-members:getEventTeamMembers",
      data: { event_id: eventId, code: error.code },
    });
    return [];
  }

  return ((data ?? []) as unknown as EventTeamMemberRow[]).map((row) => ({
    id: row.id,
    contact_id: row.contact_id,
    role: row.role,
    notes: row.notes,
    created_at: row.created_at,
    contact: Array.isArray(row.contact)
      ? row.contact[0]
      : row.contact ?? {
          id: row.contact_id,
          first_name: null,
          last_name: null,
          email: null,
          phone: null,
        },
  }));
}
