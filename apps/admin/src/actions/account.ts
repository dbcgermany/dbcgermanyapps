"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export interface AccountProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  theme: "light" | "dark";
  email_notifications: boolean;
  role: string;
  birthday: string | null; // YYYY-MM-DD
  phone: string | null; // E.164
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null; // ISO-2
}

const E164 = /^\+[1-9][0-9]{7,14}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function getAccountProfile(): Promise<AccountProfile> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, first_name, last_name, display_name, avatar_url, locale, theme,
       email_notifications, role, birthday, phone,
       address_line1, address_line2, address_city, address_state,
       address_postal_code, address_country`
    )
    .eq("id", user.userId)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...(data as Omit<AccountProfile, "email">),
    email: user.email,
  };
}

export interface ProfileFormInput {
  first_name: string;
  last_name: string;
  birthday: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
}

export async function updateAccountProfile(input: ProfileFormInput) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const first = input.first_name.trim();
  const last = input.last_name.trim();
  if (!first) return { error: "First name is required." };

  const phone = input.phone?.trim() || null;
  if (phone && !E164.test(phone)) {
    return { error: "Phone must be in E.164 format (e.g. +4930123456)." };
  }

  const birthday = input.birthday?.trim() || null;
  if (birthday && !ISO_DATE.test(birthday)) {
    return { error: "Birthday must be in ISO-8601 date format." };
  }

  const country = input.address_country?.trim().toUpperCase() || null;
  if (country && country.length !== 2) {
    return { error: "Country must be an ISO-3166-1 alpha-2 code." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: first,
      last_name: last || null,
      birthday,
      phone,
      address_line1: input.address_line1?.trim() || null,
      address_line2: input.address_line2?.trim() || null,
      address_city: input.address_city?.trim() || null,
      address_state: input.address_state?.trim() || null,
      address_postal_code: input.address_postal_code?.trim() || null,
      address_country: country,
    })
    .eq("id", user.userId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_profile",
    entity_type: "profiles",
    entity_id: user.userId,
    details: { fields: Object.keys(input) },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

import {
  NOTIFICATION_TYPE_VALUES,
  type NotificationType,
} from "@dbc/types";

export interface NotificationPreferenceRow {
  notification_type: NotificationType;
  in_app: boolean;
  email: boolean;
}

/** Load the current user's notification preference rows. Missing types
 *  simply don't appear in the result — the client falls back to the
 *  NOTIFICATION_DEFAULTS from @dbc/types. */
export async function listNotificationPreferences(): Promise<
  NotificationPreferenceRow[]
> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("notification_type, in_app, email")
    .eq("user_id", user.userId);
  return (data ?? []) as NotificationPreferenceRow[];
}

/** Upsert one row per (user, type). Any unknown types coming from the
 *  client (stale bundle, tampered payload) are dropped. */
export async function updateNotificationPreferences(
  prefs: Partial<Record<NotificationType, { in_app: boolean; email: boolean }>>
): Promise<{ error?: string; success?: true }> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  const allowed = new Set<string>(NOTIFICATION_TYPE_VALUES);
  const rows = Object.entries(prefs)
    .filter(([type]) => allowed.has(type))
    .map(([type, p]) => ({
      user_id: user.userId,
      notification_type: type,
      in_app: !!p?.in_app,
      email: !!p?.email,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length === 0) return { success: true };
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,notification_type" });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export interface PreferencesFormInput {
  locale: string;
  theme: "light" | "dark";
  email_notifications: boolean;
}

export async function updateAccountPreferences(input: PreferencesFormInput) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  if (!["en", "de", "fr"].includes(input.locale)) {
    return { error: "Invalid locale." };
  }
  if (input.theme !== "light" && input.theme !== "dark") {
    return { error: "Invalid theme." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      locale: input.locale,
      theme: input.theme,
      email_notifications: input.email_notifications,
    })
    .eq("id", user.userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadAccountAvatar(file: File) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const { toWebp } = await import("@/lib/webp");
  const { buffer, contentType, extension } = await toWebp(file, {
    maxDim: 512,
  });

  const path = `${user.userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { upsert: false, contentType });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true, url: publicUrl };
}

export async function requestPasswordReset() {
  const user = await requireRole("team_member");
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";

  // Generate a recovery link (does NOT send email — we send it via Resend ourselves)
  const { data, error } = await service.auth.admin.generateLink({
    type: "recovery",
    email: user.email,
    options: {
      redirectTo: `${adminUrl}/en/set-password`,
    },
  });

  if (error) return { error: error.message };

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    return { error: "Failed to generate recovery link." };
  }

  // Fetch user's display name + locale for personalised email
  const { data: profile } = await service
    .from("profiles")
    .select("display_name, locale")
    .eq("id", user.userId)
    .maybeSingle();

  const locale = (profile?.locale === "de" || profile?.locale === "fr"
    ? profile.locale
    : "en") as "en" | "de" | "fr";
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || undefined;

  try {
    const { sendPasswordReset } = await import("@dbc/email");
    await sendPasswordReset({
      to: user.email,
      recipientName: firstName,
      actionLink,
      locale,
    });
  } catch (err) {
    console.error("[requestPasswordReset] email send failed:", err);
    return { error: "Failed to send reset email. Please try again." };
  }

  return { success: true };
}

export async function signOutEverywhere() {
  const user = await requireRole("team_member");
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await service.auth.admin.signOut(user.userId, "global");
  if (error) return { error: error.message };
  return { success: true };
}

export interface SessionRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  not_after: string | null;
  aal: string;
  user_agent: string | null;
  ip: string | null;
}

export async function listMySessions(): Promise<SessionRow[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("list_my_sessions");
  return (data as SessionRow[] | null) ?? [];
}

export async function revokeMySession(sessionId: string) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("revoke_my_session", {
    p_session_id: sessionId,
  });
  if (error) return { error: error.message };
  if (data !== true) return { error: "Session not found or not yours." };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "revoke_session",
    entity_type: "auth.sessions",
    entity_id: sessionId,
    details: {},
  });

  return { success: true as const };
}
