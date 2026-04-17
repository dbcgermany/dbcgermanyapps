import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaffMember, getEventsForAssignment } from "@/actions/staff";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@dbc/ui";
import { StaffDetailClient } from "./staff-detail-client";

const ROLE_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "info" | "accent"> = {
  super_admin: "error",
  admin: "accent",
  manager: "info",
  team_member: "default",
};

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let data;
  try {
    data = await getStaffMember(id);
  } catch {
    notFound();
  }

  const allEvents = await getEventsForAssignment();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";

  const eventsWithTitles = allEvents.map((e) => ({
    id: e.id,
    title: (e[`title_${l}` as keyof typeof e] as string) || e.title_en,
    startsAt: e.starts_at,
  }));

  const displayName = data.profile.display_name || data.profile.email;

  return (
    <div>
      <Link
        href={`/${locale}/staff`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Staff
      </Link>

      <PageHeader
        title={displayName}
        description={data.profile.email}
        cta={
          <div className="flex items-center gap-3">
            {data.linkedTeamMember && (
              <Link
                href={`/${locale}/team/${data.linkedTeamMember.id}`}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Team profile &rarr;
              </Link>
            )}
            <Badge variant={ROLE_VARIANT[data.profile.role] ?? "default"}>
              {data.profile.role.replace("_", " ")}
            </Badge>
          </div>
        }
      />

      <StaffDetailClient
        profile={data.profile}
        assignments={data.assignments}
        auditLog={data.auditLog}
        allEvents={eventsWithTitles}
        locale={locale}
      />
    </div>
  );
}
