"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@dbc/types";

const STAFF_ROLES: UserRole[] = [
  "team_member",
  "manager",
  "admin",
  "super_admin",
];

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getStaff() {
  await requireRole("admin");
  const supabase = await createServerClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, locale, created_at")
    .in("role", STAFF_ROLES)
    .order("role", { ascending: true });

  if (error) throw new Error(error.message);

  // Fetch emails via service client (profiles doesn't store email)
  const service = getServiceClient();
  const staffWithEmail = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data } = await service.auth.admin.getUserById(p.id);
      return {
        ...p,
        email: data.user?.email ?? "",
        lastSignInAt: data.user?.last_sign_in_at ?? null,
      };
    })
  );

  // Fetch assigned events per staff
  const { data: assignments } = await supabase
    .from("staff_event_assignments")
    .select("staff_id, event_id");

  const assignmentsByStaff = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    if (!assignmentsByStaff.has(a.staff_id))
      assignmentsByStaff.set(a.staff_id, []);
    assignmentsByStaff.get(a.staff_id)!.push(a.event_id);
  }

  return staffWithEmail.map((s) => ({
    ...s,
    assignedEventIds: assignmentsByStaff.get(s.id) ?? [],
  }));
}

/**
 * Lightweight helper used by event sub-pages (run sheet, checklist) to populate
 * assignee dropdowns. Unlike getStaff(), does NOT hit auth admin API and allows
 * manager-level access.
 */
export async function getAssignableStaff() {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .in("role", STAFF_ROLES)
    .order("display_name", { ascending: true });

  return data ?? [];
}

export async function getStaffMember(staffId: string) {
  await requireRole("admin");
  const supabase = await createServerClient();
  const service = getServiceClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, locale, created_at")
    .eq("id", staffId)
    .single();

  if (error || !profile) throw new Error("Staff member not found");

  const { data: authData } = await service.auth.admin.getUserById(staffId);
  const email = authData.user?.email ?? "";

  const [assignmentsRes, auditRes, teamMemberRes] = await Promise.all([
    supabase
      .from("staff_event_assignments")
      .select("event_id, events:events(id, title_en, title_de, title_fr, starts_at)")
      .eq("staff_id", staffId),
    supabase
      .from("audit_log")
      .select("id, action, entity_type, entity_id, details, created_at")
      .eq("user_id", staffId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("team_members")
      .select("id, name, role_en, visibility")
      .eq("profile_id", staffId)
      .maybeSingle(),
  ]);

  return {
    profile: { ...profile, email },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignments: (assignmentsRes.data ?? []).map((a: any) => a.events).filter(Boolean),
    auditLog: auditRes.data ?? [],
    linkedTeamMember: teamMemberRes.data,
  };
}

export async function inviteStaff(formData: FormData) {
  const actor = await requireRole("admin");
  const service = getServiceClient();

  const email = (formData.get("email") as string).trim().toLowerCase();
  const role = formData.get("role") as UserRole;
  const displayName = formData.get("display_name") as string;
  const locale = formData.get("locale") as string;

  if (!email || !STAFF_ROLES.includes(role)) {
    return { error: "Invalid email or role" };
  }

  // Only super_admin can create other super_admins
  if (role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can create super admins" };
  }

  // Only super_admin + admin can create admins
  if (role === "admin" && actor.role !== "super_admin" && actor.role !== "admin") {
    return { error: "You do not have permission to create admins" };
  }

  // Generate an invite link without triggering Supabase's default SMTP email,
  // so we can send our own branded Resend template instead. `must_change_password`
  // is enforced by middleware in proxy.ts until the user sets a password.
  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
  const inviteLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const resolvedName = displayName || email.split("@")[0];

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: {
          display_name: resolvedName,
          locale,
          must_change_password: true,
        },
        redirectTo: `${adminUrl}/${inviteLocale}/set-password`,
      },
    });

  if (linkError || !linkData?.user || !linkData.properties?.action_link) {
    return { error: linkError?.message ?? "Failed to generate invite link" };
  }

  // The auth trigger auto-creates the profile with role=buyer. Upgrade it.
  await service
    .from("profiles")
    .update({ role, display_name: resolvedName })
    .eq("id", linkData.user.id);

  try {
    const { sendStaffInvite } = await import("@dbc/email");
    await sendStaffInvite({
      to: email,
      recipientName: resolvedName,
      role,
      actionLink: linkData.properties.action_link,
      locale: inviteLocale,
    });
  } catch (err) {
    console.error("[inviteStaff] branded email failed:", err);
    return { error: "Invite created but email delivery failed. Use Resend invite to retry." };
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "invite_staff",
    entity_type: "profiles",
    entity_id: linkData.user.id,
    details: { email, role },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function resendStaffInvite(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  const service = getServiceClient();

  const { data: authData, error: authErr } =
    await service.auth.admin.getUserById(staffId);
  if (authErr || !authData.user) return { error: "User not found" };
  if (authData.user.last_sign_in_at) {
    return {
      error:
        "This user has already signed in. Use password reset instead of resend invite.",
    };
  }

  const { data: profile } = await service
    .from("profiles")
    .select("role, display_name, locale")
    .eq("id", staffId)
    .single();
  if (!profile) return { error: "Profile not found" };

  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
  const inviteLocale = (profile.locale === "de" || profile.locale === "fr"
    ? profile.locale
    : "en") as "en" | "de" | "fr";
  const email = authData.user.email ?? "";

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `${adminUrl}/${inviteLocale}/set-password`,
      },
    });
  if (linkError || !linkData.properties?.action_link) {
    return { error: linkError?.message ?? "Failed to generate link" };
  }

  try {
    const { sendStaffInvite } = await import("@dbc/email");
    await sendStaffInvite({
      to: email,
      recipientName: profile.display_name ?? email.split("@")[0],
      role: profile.role ?? "team_member",
      actionLink: linkData.properties.action_link,
      locale: inviteLocale,
    });
  } catch (err) {
    console.error("[resendStaffInvite] email failed:", err);
    return { error: "Failed to send invite email" };
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "resend_staff_invite",
    entity_type: "profiles",
    entity_id: staffId,
    details: { email },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function revokeStaffInvite(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  const service = getServiceClient();

  const { data: authData, error: authErr } =
    await service.auth.admin.getUserById(staffId);
  if (authErr || !authData.user) return { error: "User not found" };
  if (authData.user.last_sign_in_at) {
    return {
      error:
        "This user has already accepted the invite. Use Remove staff instead.",
    };
  }

  // Prevent self-revoke (safety net; they shouldn't show up as invited)
  if (staffId === actor.userId) return { error: "You cannot revoke yourself" };

  const { error } = await service.auth.admin.deleteUser(staffId);
  if (error) return { error: error.message };

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "revoke_staff_invite",
    entity_type: "profiles",
    entity_id: staffId,
    details: { email: authData.user.email },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function updateStaffRole(
  staffId: string,
  newRole: UserRole,
  locale: string
) {
  const actor = await requireRole("admin");
  const supabase = await createServerClient();

  // Prevent self-demotion
  if (staffId === actor.userId) {
    return { error: "You cannot change your own role" };
  }

  // Only super_admin can set/unset super_admin
  if (newRole === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can assign super admin role" };
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", staffId)
    .single();

  if (
    currentProfile?.role === "super_admin" &&
    actor.role !== "super_admin"
  ) {
    return { error: "Only super admin can modify a super admin" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", staffId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: actor.userId,
    action: "update_staff_role",
    entity_type: "profiles",
    entity_id: staffId,
    details: { new_role: newRole, from_role: currentProfile?.role },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function assignStaffToEvent(
  staffId: string,
  eventId: string,
  locale: string
) {
  const actor = await requireRole("admin");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("staff_event_assignments")
    .upsert({ staff_id: staffId, event_id: eventId });

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: actor.userId,
    action: "assign_staff_to_event",
    entity_type: "staff_event_assignments",
    entity_id: staffId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function unassignStaffFromEvent(
  staffId: string,
  eventId: string,
  locale: string
) {
  const actor = await requireRole("admin");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("staff_event_assignments")
    .delete()
    .eq("staff_id", staffId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: actor.userId,
    action: "unassign_staff_from_event",
    entity_type: "staff_event_assignments",
    entity_id: staffId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function removeStaff(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  const supabase = await createServerClient();

  if (staffId === actor.userId) {
    return { error: "You cannot remove yourself" };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", staffId)
    .single();

  if (
    targetProfile?.role === "super_admin" &&
    actor.role !== "super_admin"
  ) {
    return { error: "Only super admin can remove a super admin" };
  }

  // Demote to buyer (don't delete the auth user — keeps audit trail intact)
  const { error } = await supabase
    .from("profiles")
    .update({ role: "buyer" })
    .eq("id", staffId);

  if (error) return { error: error.message };

  // Clean up event assignments
  await supabase
    .from("staff_event_assignments")
    .delete()
    .eq("staff_id", staffId);

  await supabase.from("audit_log").insert({
    user_id: actor.userId,
    action: "remove_staff",
    entity_type: "profiles",
    entity_id: staffId,
    details: { from_role: targetProfile?.role },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

export async function getEventsForAssignment() {
  await requireRole("admin");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at")
    .gte("ends_at", new Date(Date.now() - 86400000).toISOString())
    .order("starts_at", { ascending: true });

  return data ?? [];
}
