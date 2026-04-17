import { getStaff, getEventsForAssignment } from "@/actions/staff";
import { StaffClient } from "./staff-client";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [staff, events] = await Promise.all([
    getStaff(),
    getEventsForAssignment(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">
        {locale === "de"
          ? "Mitarbeiterverwaltung"
          : locale === "fr"
            ? "Gestion du personnel"
            : "Staff Management"}
      </h1>

      <StaffClient
        locale={locale}
        staff={staff.map((s) => ({
          id: s.id,
          email: s.email,
          displayName: s.display_name ?? "",
          role: s.role,
          assignedEventIds: s.assignedEventIds,
        }))}
        events={events.map((e) => ({
          id: e.id,
          title:
            (e[`title_${locale}` as keyof typeof e] as string) || e.title_en,
          startsAt: e.starts_at,
        }))}
      />
    </div>
  );
}
