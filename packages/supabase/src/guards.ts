import { createServerClient } from "./server-client";
import type { AdminModule, CrudAction, UserRole } from "@dbc/types";
import { PERMISSIONS, ROLE_HIERARCHY } from "@dbc/types";

interface AuthResult {
  userId: string;
  role: UserRole;
  email: string;
}

/**
 * Server Action guard — checks that the current user has at least
 * the specified role level. Throws if unauthorized.
 *
 * Usage:
 *   const user = await requireRole("manager");
 */
export async function requireRole(minimumRole: UserRole): Promise<AuthResult> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Unauthorized: no profile found");
  }

  const userLevel = ROLE_HIERARCHY[profile.role as UserRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  if (userLevel < requiredLevel) {
    throw new Error(
      `Forbidden: requires ${minimumRole}, has ${profile.role}`
    );
  }

  return {
    userId: user.id,
    role: profile.role as UserRole,
    email: user.email ?? "",
  };
}

/**
 * Server Action guard — looks up the minimum role for a (module, action)
 * pair in the canonical PERMISSIONS matrix and delegates to requireRole().
 * Throws if the action is not permitted on this module (matrix cell = null)
 * or the caller lacks the required role.
 *
 * Usage:
 *   const user = await requirePermission("events", "create"); // → manager+
 *   const user = await requirePermission("orders", "delete"); // → admin+
 */
export async function requirePermission(
  mod: AdminModule,
  action: CrudAction,
): Promise<AuthResult> {
  const required = PERMISSIONS[mod][action];
  if (required === null) {
    throw new Error(`Forbidden: action "${action}" not allowed on "${mod}"`);
  }
  return requireRole(required);
}
