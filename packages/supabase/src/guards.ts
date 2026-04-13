import { createServerClient } from "./server-client";
import type { UserRole } from "@dbc/types";
import { ROLE_HIERARCHY } from "@dbc/types";

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
