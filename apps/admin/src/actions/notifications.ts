"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export async function markReadAction(notificationId: string, locale: string) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.userId)
    .is("read_at", null);

  revalidatePath(`/${locale}/notifications`);
  return { success: true };
}

export async function markAllReadAction(locale: string) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.userId)
    .is("read_at", null);

  revalidatePath(`/${locale}/notifications`);
  return { success: true };
}

export async function getAllNotifications() {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, data, read_at, created_at")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return data;
}
