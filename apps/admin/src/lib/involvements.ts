/**
 * Shared enum + types for contact <-> event involvements.
 *
 * Kept outside actions/contacts.ts because that file is "use server",
 * which forbids exporting non-async values (runtime rejects const arrays
 * and types marked as exports in server action files).
 */

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

export interface InvolvementRow {
  id: string;
  contact_id: string;
  event_id: string;
  role: InvolvementRole;
  notes: string | null;
  created_at: string;
  event?: { id: string; title_en: string; starts_at: string } | null;
}
