/**
 * Contact <-> event involvement enums are the SSOT in @dbc/types. This
 * file stays as the admin-app barrel so consumers can keep their
 * existing `@/lib/involvements` imports, and exposes one admin-scoped
 * projected row shape (InvolvementRow) that's used by the contact
 * detail / list pages.
 */

export {
  INVOLVEMENT_ROLES,
  type InvolvementRole,
} from "@dbc/types";

import type { InvolvementRole } from "@dbc/types";

export interface InvolvementRow {
  id: string;
  contact_id: string;
  event_id: string;
  role: InvolvementRole;
  notes: string | null;
  created_at: string;
  event?: { id: string; title_en: string; starts_at: string } | null;
}
