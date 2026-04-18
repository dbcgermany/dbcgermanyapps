import type { UserRole } from "@dbc/types";
import { createServerClient } from "@dbc/supabase/server";
import { AdminSidebar } from "./admin-sidebar";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

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
  // Fetch initial notifications + unread count
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
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar locale={locale} userRole={userRole} userEmail={userEmail} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — sticky on mobile so it stays pinned alongside the fixed hamburger.
            Leave left padding on mobile so the burger (top-3 left-3) doesn't collide. */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-border bg-surface/95 pl-16 pr-4 backdrop-blur md:pl-4">
          <NotificationBell
            userId={userId}
            locale={locale}
            initialUnreadCount={unreadResult.count ?? 0}
            initialNotifications={notifResult.data ?? []}
          />
          <UserMenu
            locale={locale}
            userEmail={userEmail}
            displayName={profileResult.data?.display_name ?? null}
            avatarUrl={profileResult.data?.avatar_url ?? null}
            role={userRole}
          />
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto max-w-7xl p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
