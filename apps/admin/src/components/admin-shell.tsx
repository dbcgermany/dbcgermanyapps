import type { UserRole } from "@dbc/types";
import { createServerClient } from "@dbc/supabase/server";
import { AdminShellLayout } from "./admin-shell-layout";

export async function AdminShell({
  children,
  locale,
  userId,
  userRole,
  userEmail,
}: {
  children: React.ReactNode;
  locale: string;
  userId: string;
  userRole: UserRole;
  userEmail: string;
}) {
  const supabase = await createServerClient();

  const [notifResult, unreadResult, profileResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return (
    <AdminShellLayout
      locale={locale}
      userId={userId}
      userRole={userRole}
      userEmail={userEmail}
      displayName={profileResult.data?.display_name ?? null}
      avatarUrl={profileResult.data?.avatar_url ?? null}
      initialUnreadCount={unreadResult.count ?? 0}
      initialNotifications={notifResult.data ?? []}
    >
      {children}
    </AdminShellLayout>
  );
}
