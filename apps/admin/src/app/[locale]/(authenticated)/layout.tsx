import { requireRole } from "@dbc/supabase/server";
import { AdminShell } from "@/components/admin-shell";

export default async function AuthenticatedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireRole("team_member");

  return (
    <AdminShell
      locale={locale}
      userId={user.userId}
      userRole={user.role}
      userEmail={user.email}
    >
      {children}
    </AdminShell>
  );
}
