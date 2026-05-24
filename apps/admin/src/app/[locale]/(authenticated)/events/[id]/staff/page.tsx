import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@dbc/ui";
import { getEvent } from "@/actions/events";
import { getEventStaff } from "@/actions/event-staff";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";

const PT = {
  en: {
    title: "Event staff",
    description:
      "DBC team members assigned to work this event (door scanners, managers, on-site admins).",
    empty:
      "No staff assigned to this event yet. Assign staff from the global /staff page.",
    name: "Name",
    role: "Role",
    assignedOn: "Assigned",
    countSuffix: "on duty",
    roles: {
      admin: "Admin",
      manager: "Manager",
      team_member: "Team member",
      scanner: "Scanner",
      unknown: "Unknown",
    } as Record<string, string>,
  },
  de: {
    title: "Veranstaltungs-Team",
    description:
      "DBC-Teammitglieder, die für diese Veranstaltung eingeteilt sind (Scanner, Manager, Admins vor Ort).",
    empty:
      "Noch kein Personal eingeteilt. Personal auf der globalen Seite /staff zuweisen.",
    name: "Name",
    role: "Rolle",
    assignedOn: "Zugewiesen",
    countSuffix: "im Einsatz",
    roles: {
      admin: "Admin",
      manager: "Manager",
      team_member: "Teammitglied",
      scanner: "Scanner",
      unknown: "Unbekannt",
    } as Record<string, string>,
  },
  fr: {
    title: "Équipe de l'événement",
    description:
      "Membres de l'équipe DBC affectés à cet événement (scanners, managers, admins sur place).",
    empty:
      "Aucun personnel affecté. Affectez du personnel depuis la page globale /staff.",
    name: "Nom",
    role: "Rôle",
    assignedOn: "Affecté",
    countSuffix: "en service",
    roles: {
      admin: "Admin",
      manager: "Manager",
      team_member: "Équipe",
      scanner: "Scanner",
      unknown: "Inconnu",
    } as Record<string, string>,
  },
} as const;

const ROLE_VARIANT: Record<string, "default" | "accent" | "warning" | "success"> = {
  admin: "accent",
  manager: "warning",
  team_member: "success",
  scanner: "default",
  unknown: "default",
};

export default async function EventStaffPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const pt = PT[l];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  let eventTitle: string;
  try {
    const event = await getEvent(eventId);
    eventTitle =
      (event[`title_${l}` as keyof typeof event] as string) || event.title_en;
  } catch {
    notFound();
  }

  const staff = await getEventStaff(eventId);

  return (
    <div>
      <PageHeader
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        title={pt.title}
        description={`${eventTitle} · ${staff.length} ${pt.countSuffix}`}
      />

      <div className="mt-6">
        {staff.length === 0 ? (
          <EmptyState message={pt.empty} />
        ) : (
          <>
            <MobileList
              className="md:hidden"
              items={staff}
              renderCell={(s) => ({
                id: s.staffId,
                title: s.displayName || s.staffId.slice(0, 8),
                meta: pt.roles[s.role] ?? s.role,
                href: `/${locale}/staff/${s.staffId}`,
              })}
            />

            <div className="hidden md:block">
              <DataTable
                columns={[
                  pt.name,
                  pt.role,
                  { label: pt.assignedOn, align: "right" },
                ]}
              >
                {staff.map((s) => (
                  <DataTable.Row key={s.staffId}>
                    <DataTable.Cell>
                      <Link
                        href={`/${locale}/staff/${s.staffId}`}
                        className="font-medium hover:text-primary"
                      >
                        {s.displayName || s.staffId.slice(0, 8)}
                      </Link>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Badge variant={ROLE_VARIANT[s.role] ?? "default"}>
                        {pt.roles[s.role] ?? s.role}
                      </Badge>
                    </DataTable.Cell>
                    <DataTable.Cell align="right">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(s.assignedAt).toLocaleDateString(locale)}
                      </span>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
