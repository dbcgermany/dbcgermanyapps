import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NOTIFICATION_DEFAULTS,
  type NotificationType,
} from "@dbc/types";

export type { NotificationType };

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface PreferenceRow {
  user_id: string;
  in_app: boolean;
  email: boolean;
}

/**
 * Fan out a notification to every manager+ admin, respecting each user's
 * per-type, per-channel preferences (notification_preferences table).
 * Users with no preference row for the given type fall back to the SSOT
 * NOTIFICATION_DEFAULTS in @dbc/types — so new types ship with a
 * sensible pre-ticked default and nobody gets silent-dropped.
 *
 * Must be called with a client that can read profiles + insert
 * notifications (typically the service-role client, since most call
 * sites are webhooks or server actions outside a user session).
 */
export async function notifyAdmins(
  supabase: SupabaseClient,
  input: CreateNotificationInput
): Promise<void> {
  // 1. Every manager+ recipient with their email (for the email channel).
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, email_notifications")
    .in("role", ["manager", "admin", "super_admin"]);
  if (error || !profiles || profiles.length === 0) return;

  // 2. Their per-type preferences. Missing row = use default.
  const userIds = profiles.map((p) => p.id);
  const { data: prefRows } = await supabase
    .from("notification_preferences")
    .select("user_id, in_app, email")
    .eq("notification_type", input.type)
    .in("user_id", userIds);
  const prefByUser = new Map<string, PreferenceRow>();
  for (const r of (prefRows ?? []) as PreferenceRow[]) {
    prefByUser.set(r.user_id, r);
  }
  const def = NOTIFICATION_DEFAULTS[input.type] ?? { in_app: true, email: false };

  // 3. In-app fan-out.
  const inAppRows = profiles
    .filter((p) => prefByUser.get(p.id)?.in_app ?? def.in_app)
    .map((p) => ({
      user_id: p.id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: input.data ?? {},
    }));
  if (inAppRows.length > 0) {
    await supabase.from("notifications").insert(inAppRows);
  }

  // 4. Email fan-out — respects the per-type email toggle AND the master
  // profiles.email_notifications kill-switch (set to true by default).
  // Loaded via dynamic import so @dbc/supabase doesn't need a static
  // dependency on @dbc/email.
  const emailRecipients = profiles
    .filter((p) => {
      const wantsEmail = prefByUser.get(p.id)?.email ?? def.email;
      const masterOn = p.email_notifications !== false;
      return wantsEmail && masterOn && !!p.email;
    })
    .map((p) => p.email as string);

  if (emailRecipients.length === 0) return;

  try {
    const { sendAdminAlert } = await import("@dbc/email");
    await sendAdminAlert({
      to: emailRecipients,
      subject: `[DBC Admin] ${input.title}`,
      headline: input.title,
      body: input.body ?? "",
      details:
        input.data && Object.keys(input.data).length > 0
          ? Object.fromEntries(
              Object.entries(input.data).map(([k, v]) => [k, String(v)])
            )
          : undefined,
      dashboardUrl: (input.data?.admin_href as string | undefined) ?? undefined,
      severity: "info",
      locale: "en",
    });
  } catch (err) {
    // Don't let email failure break the caller — the in-app notification
    // already succeeded. Resend may reject while the domain is still
    // unverified; log for operator visibility.
    console.error("[notifyAdmins] sendAdminAlert failed:", err);
  }
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
