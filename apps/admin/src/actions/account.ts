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

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${user.userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: false, contentType: file.type });
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

  const { error } = await service.auth.admin.generateLink({
    type: "recovery",
    email: user.email,
  });

  if (error) return { error: error.message };
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
