import { getTranslations } from "next-intl/server";
import {
  getStaff,
  getEventsForAssignment,
  getPendingInvitations,
} from "@/actions/staff";
import { PageHeader } from "@/components/page-header";
import { StaffClient } from "./staff-client";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.staff.list" });

  const [staff, events, pending] = await Promise.all([
    getStaff(),
    getEventsForAssignment(),
    getPendingInvitations(),
  ]);

  return (
    <div>
      <PageHeader title={t("title")} />

      <StaffClient
        locale={locale}
        staff={staff.map((s) => ({
          id: s.id,
          email: s.email,
          displayName: s.display_name ?? "",
          role: s.role,
          assignedEventIds: s.assignedEventIds,
          lastSignInAt: s.lastSignInAt,
          bannedUntil: s.bannedUntil,
        }))}
        events={events.map((e) => ({
          id: e.id,
          title:
            (e[`title_${locale}` as keyof typeof e] as string) || e.title_en,
          startsAt: e.starts_at,
        }))}
        pendingInvitations={pending}
      />
    </div>
  );
}
