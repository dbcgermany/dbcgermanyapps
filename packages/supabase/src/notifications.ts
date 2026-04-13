import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "new_order"
  | "tier_sold_out"
  | "refund_issued"
  | "check_in_milestone"
  | "waitlist_available"
  | "door_sale"
  | "transfer"
  | "sequence_sent";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * Creates a notification for every user with role >= 'manager'.
 * Called from Server Actions, webhooks, and cron jobs.
 *
 * Uses a service-role client to bypass cookie-based auth (webhooks don't have cookies).
 */
export async function notifyAdmins(
  supabase: SupabaseClient,
  input: CreateNotificationInput
): Promise<void> {
  // Find all manager+ users
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["manager", "admin", "super_admin"]);

  if (error || !profiles || profiles.length === 0) return;

  const rows = profiles.map((p) => ({
    user_id: p.id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    data: input.data ?? {},
  }));

  await supabase.from("notifications").insert(rows);
}

/**
 * Marks a single notification as read for a specific user.
 */
export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null);
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
