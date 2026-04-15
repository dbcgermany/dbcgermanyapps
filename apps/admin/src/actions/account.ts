"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export interface AccountProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  theme: "light" | "dark" | "system";
  email_notifications: boolean;
  role: string;
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale, theme, email_notifications, role")
    .eq("id", user.userId)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...(data as Omit<AccountProfile, "email">),
    email: user.email,
  };
}

export async function updateAccountProfile(formData: FormData) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const display_name =
    ((formData.get("display_name") as string) || "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateAccountPreferences(formData: FormData) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const locale = (formData.get("locale") as string) || "en";
  const themeRaw = (formData.get("theme") as string) || "system";
  const theme = (["light", "dark", "system"].includes(themeRaw)
    ? themeRaw
    : "system") as "light" | "dark" | "system";
  const email_notifications = formData.get("email_notifications") === "on";

  if (!["en", "de", "fr"].includes(locale)) {
    return { error: "Invalid locale." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ locale, theme, email_notifications })
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
