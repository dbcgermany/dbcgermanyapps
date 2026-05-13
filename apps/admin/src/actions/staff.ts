"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { STAFF_ROLES } from "@dbc/types";
import type { UserRole } from "@dbc/types";
import { buildAuthConfirmUrl } from "@/lib/auth-confirm-url";
import { resolveLocale } from "@dbc/email";
import { randomBytes } from "crypto";

function generateTempPassword() {
  // 16 chars, URL-safe alphabet — strong enough as a one-time bootstrap
  // password since must_change_password=true forces a rotation on first login.
  return randomBytes(12).toString("base64url");
}

function adminUrl() {
  return process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
}

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
      const bannedUntilRaw =
        (data.user as { banned_until?: string | null } | null)?.banned_until ??
        null;
      const bannedUntil =
        bannedUntilRaw && new Date(bannedUntilRaw).getTime() > Date.now()
          ? bannedUntilRaw
          : null;
      return {
        ...p,
        email: data.user?.email ?? "",
        lastSignInAt: data.user?.last_sign_in_at ?? null,
        bannedUntil,
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
  const bannedUntilRaw =
    (authData.user as { banned_until?: string | null } | null)?.banned_until ??
    null;
  const bannedUntil =
    bannedUntilRaw && new Date(bannedUntilRaw).getTime() > Date.now()
      ? bannedUntilRaw
      : null;

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
    profile: { ...profile, email, bannedUntil },
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

  if (linkError || !linkData?.user || !linkData.properties?.hashed_token) {
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
      actionLink: buildAuthConfirmUrl(
        linkData.properties.hashed_token,
        "invite",
        inviteLocale
      ),
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
        data: { must_change_password: true },
        redirectTo: `${adminUrl}/${inviteLocale}/set-password`,
      },
    });
  if (linkError || !linkData.properties?.hashed_token) {
    return { error: linkError?.message ?? "Failed to generate link" };
  }

  try {
    const { sendStaffInvite } = await import("@dbc/email");
    await sendStaffInvite({
      to: email,
      recipientName: profile.display_name ?? email.split("@")[0],
      role: profile.role ?? "team_member",
      actionLink: buildAuthConfirmUrl(
        linkData.properties.hashed_token,
        "invite",
        inviteLocale
      ),
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

/**
 * Lists Supabase auth users who were invited (invited_at NOT NULL) but
 * never signed in (last_sign_in_at IS NULL) AND aren't already in the
 * staff list. Catches the common gap where an invite was issued via the
 * Supabase dashboard or some external flow that didn't promote
 * profiles.role above 'buyer' — those users are otherwise invisible to
 * the admin and the resend button has nowhere to live.
 */
export async function getPendingInvitations() {
  await requireRole("admin");
  const service = getServiceClient();

  // listUsers paginates at 50 per page by default; bump to 200 to cover
  // the full set without paging on a small project.
  const { data, error } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) return [];

  // Collect candidates: invited but never signed in.
  const candidates = (data?.users ?? []).filter(
    (u) => u.invited_at && !u.last_sign_in_at
  );
  if (candidates.length === 0) return [];

  // Filter out anyone already with a staff role (they show in the main
  // staff list — duplicating them here would just be noise).
  const candidateIds = candidates.map((u) => u.id);
  const supabase = await createServerClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .in("id", candidateIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return candidates
    .filter((u) => {
      const role = profileById.get(u.id)?.role ?? "buyer";
      return !STAFF_ROLES.includes(role as UserRole);
    })
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      displayName:
        profileById.get(u.id)?.display_name ??
        ((u.user_metadata?.display_name as string | undefined) ?? ""),
      invitedAt: u.invited_at ?? null,
      currentRole: (profileById.get(u.id)?.role ?? "buyer") as UserRole,
    }))
    .sort((a, b) => {
      const aDate = a.invitedAt ? new Date(a.invitedAt).getTime() : 0;
      const bDate = b.invitedAt ? new Date(b.invitedAt).getTime() : 0;
      return bDate - aDate;
    });
}

/**
 * Promotes an auth user to a staff role and immediately resends a fresh
 * invite link via the existing branded Resend template. One-click fix
 * for users who were invited via the Supabase dashboard or whose
 * original invite expired.
 */
export async function assignRoleAndResendInvite(
  userId: string,
  newRole: UserRole,
  locale: string
) {
  const actor = await requireRole("admin");
  if (!STAFF_ROLES.includes(newRole)) {
    return { error: "Invalid staff role" };
  }
  if (newRole === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can assign super admin role" };
  }
  if (
    newRole === "admin" &&
    actor.role !== "super_admin" &&
    actor.role !== "admin"
  ) {
    return { error: "You do not have permission to create admins" };
  }

  const service = getServiceClient();

  const { data: authData, error: authErr } =
    await service.auth.admin.getUserById(userId);
  if (authErr || !authData.user) return { error: "User not found" };

  // Promote profile (auth trigger created it as buyer).
  const { error: roleErr } = await service
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (roleErr) return { error: roleErr.message };

  // Generate fresh invite link.
  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
  const inviteLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const email = authData.user.email ?? "";

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { must_change_password: true },
        redirectTo: `${adminUrl}/${inviteLocale}/set-password`,
      },
    });
  if (linkError || !linkData.properties?.hashed_token) {
    return { error: linkError?.message ?? "Failed to generate link" };
  }

  try {
    const { sendStaffInvite } = await import("@dbc/email");
    const displayName =
      ((authData.user.user_metadata?.display_name as string | undefined) ??
        email.split("@")[0]);
    await sendStaffInvite({
      to: email,
      recipientName: displayName,
      role: newRole,
      actionLink: buildAuthConfirmUrl(
        linkData.properties.hashed_token,
        "invite",
        inviteLocale
      ),
      locale: inviteLocale,
    });
  } catch (err) {
    console.error("[assignRoleAndResendInvite] email failed:", err);
    return { error: "Role set but invite email delivery failed" };
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "assign_role_and_resend_invite",
    entity_type: "profiles",
    entity_id: userId,
    details: { email, role: newRole },
  });

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Lifecycle actions: email change, create-without-invite, pause/unpause,
// reset password, force sign-out, hard delete. Self-protection and
// "can't touch a super_admin unless I am one" checks live in each action.
// ---------------------------------------------------------------------------

async function loadTargetProfile(staffId: string) {
  const service = getServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("id, role, locale, first_name, last_name, display_name")
    .eq("id", staffId)
    .single();
  return profile as
    | {
        id: string;
        role: UserRole;
        locale: string | null;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
      }
    | null;
}

export async function updateStaffEmail(
  staffId: string,
  newEmail: string,
  locale: string
) {
  const actor = await requireRole("admin");
  if (staffId === actor.userId) {
    return { error: "Use account settings to change your own email." };
  }
  const clean = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { error: "Invalid email address." };
  }

  const service = getServiceClient();
  const target = await loadTargetProfile(staffId);
  if (!target) return { error: "User not found" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can edit a super admin." };
  }

  const { data: existing } = await service.auth.admin.getUserById(staffId);
  const oldEmail = existing.user?.email ?? "";
  if (oldEmail.toLowerCase() === clean) {
    return { error: "That is already the current email." };
  }

  const { error: updateErr } = await service.auth.admin.updateUserById(
    staffId,
    { email: clean, email_confirm: true }
  );
  if (updateErr) return { error: updateErr.message };

  try {
    const { sendStaffEmailChanged } = await import("@dbc/email");
    const recipientName =
      target.display_name ?? target.first_name ?? oldEmail.split("@")[0];
    const userLocale = resolveLocale(target.locale);
    const loginUrl = `${adminUrl()}/${userLocale}/login`;

    await Promise.all([
      sendStaffEmailChanged({
        to: clean,
        recipientName,
        oldEmail,
        newEmail: clean,
        loginUrl,
        locale: userLocale,
        side: "new",
      }),
      oldEmail
        ? sendStaffEmailChanged({
            to: oldEmail,
            recipientName,
            oldEmail,
            newEmail: clean,
            loginUrl,
            locale: userLocale,
            side: "old",
          })
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("[updateStaffEmail] email notice failed:", err);
    // Email rotated successfully on Supabase even if our notice failed —
    // surface a non-fatal warning so the admin knows to follow up out-of-band.
    await service.from("audit_log").insert({
      user_id: actor.userId,
      action: "update_staff_email",
      entity_type: "profiles",
      entity_id: staffId,
      details: {
        from_email: oldEmail,
        to_email: clean,
        notice_email_failed: true,
      },
    });
    revalidatePath(`/${locale}/staff`);
    return {
      success: true,
      warning: "Email changed, but the notice email failed to send.",
    };
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "update_staff_email",
    entity_type: "profiles",
    entity_id: staffId,
    details: { from_email: oldEmail, to_email: clean },
  });

  revalidatePath(`/${locale}/staff`);
  revalidatePath(`/${locale}/staff/${staffId}`);
  return { success: true };
}

export async function createStaffWithoutInvite(formData: FormData) {
  const actor = await requireRole("admin");
  const service = getServiceClient();

  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const firstName = ((formData.get("first_name") as string) ?? "").trim();
  const lastName = ((formData.get("last_name") as string) ?? "").trim();
  const role = formData.get("role") as UserRole;
  const locale = ((formData.get("locale") as string) ?? "en").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address." };
  }
  if (!STAFF_ROLES.includes(role)) {
    return { error: "Invalid role." };
  }
  if (role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can create super admins." };
  }
  if (role === "admin" && actor.role !== "super_admin" && actor.role !== "admin") {
    return { error: "You do not have permission to create admins." };
  }

  const password = generateTempPassword();
  const userLocale = resolveLocale(locale);
  const recipientName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName || null,
      last_name: lastName || null,
      locale: userLocale,
      must_change_password: true,
    },
  });
  if (createErr || !created.user) {
    return { error: createErr?.message ?? "Failed to create user." };
  }

  // on_auth_user_created creates the profile with role=buyer; upgrade + names.
  await service
    .from("profiles")
    .update({
      role,
      first_name: firstName || null,
      last_name: lastName || null,
      locale: userLocale,
    })
    .eq("id", created.user.id);

  const loginUrl = `${adminUrl()}/${userLocale}/login`;

  try {
    const { sendStaffCredentials } = await import("@dbc/email");
    await sendStaffCredentials({
      to: email,
      recipientName,
      email,
      temporaryPassword: password,
      loginUrl,
      locale: userLocale,
      reason: "created",
    });
  } catch (err) {
    console.error("[createStaffWithoutInvite] email failed:", err);
    // Account exists but email failed. The dialog will still reveal the password
    // to the admin so they can share it out-of-band.
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "create_staff_no_invite",
    entity_type: "profiles",
    entity_id: created.user.id,
    details: { email, role },
  });

  revalidatePath(`/${locale}/staff`);
  return {
    success: true,
    userId: created.user.id,
    password,
  };
}

export async function pauseStaff(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  if (staffId === actor.userId) return { error: "You cannot pause yourself." };

  const service = getServiceClient();
  const target = await loadTargetProfile(staffId);
  if (!target) return { error: "User not found" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can pause a super admin." };
  }

  const { error: banErr } = await service.auth.admin.updateUserById(staffId, {
    ban_duration: "876000h",
  });
  if (banErr) return { error: banErr.message };

  // Kill any active sessions so the pause takes effect immediately.
  await service.auth.admin.signOut(staffId, "global");

  try {
    const { data: authData } = await service.auth.admin.getUserById(staffId);
    const email = authData.user?.email ?? "";
    if (email) {
      const { sendStaffPaused } = await import("@dbc/email");
      await sendStaffPaused({
        to: email,
        recipientName:
          target.display_name ?? target.first_name ?? email.split("@")[0],
        locale: resolveLocale(target.locale),
        state: "paused",
      });
    }
  } catch (err) {
    console.error("[pauseStaff] notice email failed:", err);
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "pause_staff",
    entity_type: "profiles",
    entity_id: staffId,
  });

  revalidatePath(`/${locale}/staff`);
  revalidatePath(`/${locale}/staff/${staffId}`);
  return { success: true };
}

export async function unpauseStaff(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  const target = await loadTargetProfile(staffId);
  if (!target) return { error: "User not found" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can unpause a super admin." };
  }

  const { error: unbanErr } = await service.auth.admin.updateUserById(staffId, {
    ban_duration: "none",
  });
  if (unbanErr) return { error: unbanErr.message };

  try {
    const { data: authData } = await service.auth.admin.getUserById(staffId);
    const email = authData.user?.email ?? "";
    if (email) {
      const { sendStaffPaused } = await import("@dbc/email");
      await sendStaffPaused({
        to: email,
        recipientName:
          target.display_name ?? target.first_name ?? email.split("@")[0],
        locale: resolveLocale(target.locale),
        state: "unpaused",
      });
    }
  } catch (err) {
    console.error("[unpauseStaff] notice email failed:", err);
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "unpause_staff",
    entity_type: "profiles",
    entity_id: staffId,
  });

  revalidatePath(`/${locale}/staff`);
  revalidatePath(`/${locale}/staff/${staffId}`);
  return { success: true };
}

export async function resetStaffPassword(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  if (staffId === actor.userId) {
    return { error: "Use account settings to change your own password." };
  }
  const service = getServiceClient();
  const target = await loadTargetProfile(staffId);
  if (!target) return { error: "User not found" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can reset a super admin's password." };
  }

  const { data: existing } = await service.auth.admin.getUserById(staffId);
  const email = existing.user?.email ?? "";
  const existingMetadata = existing.user?.user_metadata ?? {};

  const password = generateTempPassword();
  const { error: updErr } = await service.auth.admin.updateUserById(staffId, {
    password,
    user_metadata: { ...existingMetadata, must_change_password: true },
  });
  if (updErr) return { error: updErr.message };

  // Force re-login everywhere so the old password / sessions can't be used.
  await service.auth.admin.signOut(staffId, "global");

  const userLocale = resolveLocale(target.locale);
  const loginUrl = `${adminUrl()}/${userLocale}/login`;
  try {
    if (email) {
      const { sendStaffCredentials } = await import("@dbc/email");
      await sendStaffCredentials({
        to: email,
        recipientName:
          target.display_name ?? target.first_name ?? email.split("@")[0],
        email,
        temporaryPassword: password,
        loginUrl,
        locale: userLocale,
        reason: "reset",
      });
    }
  } catch (err) {
    console.error("[resetStaffPassword] email failed:", err);
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "reset_staff_password",
    entity_type: "profiles",
    entity_id: staffId,
  });

  revalidatePath(`/${locale}/staff`);
  revalidatePath(`/${locale}/staff/${staffId}`);
  return { success: true, password };
}

export async function forceSignOutStaff(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  if (staffId === actor.userId) {
    return { error: "Use account settings to sign yourself out." };
  }
  const service = getServiceClient();
  const target = await loadTargetProfile(staffId);
  if (!target) return { error: "User not found" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can sign out a super admin." };
  }

  const { error } = await service.auth.admin.signOut(staffId, "global");
  if (error) return { error: error.message };

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "force_signout_staff",
    entity_type: "profiles",
    entity_id: staffId,
  });

  revalidatePath(`/${locale}/staff`);
  revalidatePath(`/${locale}/staff/${staffId}`);
  return { success: true };
}

export async function deleteStaffHard(staffId: string, locale: string) {
  const actor = await requireRole("admin");
  if (staffId === actor.userId) return { error: "You cannot delete yourself." };

  const service = getServiceClient();
  const target = await loadTargetProfile(staffId);
  if (!target) return { error: "User not found" };
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return { error: "Only super admin can delete a super admin." };
  }

  const { data: authData } = await service.auth.admin.getUserById(staffId);
  const email = authData.user?.email ?? "";

  // Write the audit row BEFORE delete so the entry exists. After delete the
  // user_id reference dangles but the row stays readable.
  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "delete_staff_hard",
    entity_type: "profiles",
    entity_id: staffId,
    details: { email, role: target.role },
  });

  // FKs on orders.buyer_id / tickets.buyer_id / event_* / contact_category_links
  // are all ON DELETE SET NULL after migration 20260512000001, so the cascade
  // is safe. team_members.profile_id was already SET NULL.
  const { error: delErr } = await service.auth.admin.deleteUser(staffId);
  if (delErr) return { error: delErr.message };

  revalidatePath(`/${locale}/staff`);
  return { success: true };
}
