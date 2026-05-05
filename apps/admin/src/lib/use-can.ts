"use client";

import { canDo, type AdminModule, type CrudAction } from "@dbc/types";
import { useAdminShell } from "@/components/admin-shell-layout";

/**
 * Client-side permission check for the admin app. Reads the current user's
 * role from `AdminShellContext` and consults the canonical PERMISSIONS
 * matrix in @dbc/types. Use to gate buttons, tabs, and other UI affordances:
 *
 *   const canDelete = useCan("events", "delete");
 *   {canDelete && <DeleteButton />}
 *
 * For server-side checks (server actions, route handlers), use
 * `requirePermission()` from @dbc/supabase/server instead.
 */
export function useCan(mod: AdminModule, action: CrudAction): boolean {
  const { userRole } = useAdminShell();
  return canDo(userRole, mod, action);
}
