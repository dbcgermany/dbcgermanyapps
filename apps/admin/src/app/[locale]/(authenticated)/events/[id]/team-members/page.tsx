import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@dbc/ui";
import { getEvent } from "@/actions/events";
import { getEventTeamMembers } from "@/actions/event-team-members";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";

const PT = {
  en: {
    title: "Team members",
    description:
      "People involved in this event in a non-attendee capacity: sponsors, partners, contractors, speakers, moderators, volunteers, staff, press, VIPs.",
    empty:
      "No team members linked to this event yet. Link contacts to this event from the contact detail page (Involvements section).",
    name: "Name",
    role: "Role",
    contact: "Contact",
    addedOn: "Added",
    notes: "Notes",
    countSuffix: "people",
    roles: {
      sponsor: "Sponsor",
      partner: "Partner",
      contractor: "Contractor",
      speaker: "Speaker",
      moderator: "Moderator",
      volunteer: "Volunteer",
      staff: "Staff",
      press: "Press",
      vip: "VIP",
    } as Record<string, string>,
  },
  de: {
    title: "Teammitglieder",
    description:
      "Personen, die in dieser Veranstaltung NICHT als Teilnehmende mitwirken: Sponsoren, Partner, Dienstleister, Speaker, Moderation, Volunteers, Team, Presse, VIPs.",
    empty:
      "Noch keine Teammitglieder verknüpft. Verknüpfen Sie Kontakte über die Kontakt-Detailseite (Bereich Mitwirkung).",
    name: "Name",
    role: "Rolle",
    contact: "Kontakt",
    addedOn: "Hinzugefügt",
    notes: "Notizen",
    countSuffix: "Personen",
    roles: {
      sponsor: "Sponsor",
      partner: "Partner",
      contractor: "Dienstleister",
      speaker: "Speaker",
      moderator: "Moderation",
      volunteer: "Volunteer",
      staff: "Team",
      press: "Presse",
      vip: "VIP",
    } as Record<string, string>,
  },
  fr: {
    title: "Équipe",
    description:
      "Personnes impliquées dans l'événement à un autre titre que celui de participant : sponsors, partenaires, prestataires, intervenants, modération, bénévoles, équipe, presse, VIP.",
    empty:
      "Aucun membre d'équipe lié à cet événement. Liez des contacts depuis la fiche contact (section Implication).",
    name: "Nom",
    role: "Rôle",
    contact: "Contact",
    addedOn: "Ajouté",
    notes: "Notes",
    countSuffix: "personnes",
    roles: {
      sponsor: "Sponsor",
      partner: "Partenaire",
      contractor: "Prestataire",
      speaker: "Intervenant·e",
      moderator: "Modération",
      volunteer: "Bénévole",
      staff: "Équipe",
      press: "Presse",
      vip: "VIP",
    } as Record<string, string>,
  },
} as const;

const ROLE_VARIANT: Record<string, "default" | "accent" | "info" | "warning" | "success"> = {
  sponsor: "accent",
  partner: "info",
  contractor: "default",
  speaker: "accent",
  moderator: "info",
  volunteer: "success",
  staff: "warning",
  press: "default",
  vip: "accent",
};

export default async function EventTeamMembersPage({
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

  const members = await getEventTeamMembers(eventId);

  const displayName = (m: (typeof members)[number]) => {
    const full = [m.contact.first_name, m.contact.last_name]
      .filter(Boolean)
      .join(" ");
    return full || m.contact.email || m.contact_id.slice(0, 8);
  };

  return (
    <div>
      <PageHeader
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        title={pt.title}
        description={`${eventTitle} · ${members.length} ${pt.countSuffix}`}
      />

      <div className="mt-6">
        {members.length === 0 ? (
          <EmptyState message={pt.empty} />
        ) : (
          <>
            {/* Mobile (md and below): iOS-grouped cells */}
            <MobileList
              className="md:hidden"
              items={members}
              renderCell={(m) => ({
                id: m.id,
                title: displayName(m),
                meta: (
                  <span>
                    {pt.roles[m.role] ?? m.role}
                    {m.contact.email && (
                      <>
                        {" · "}
                        {m.contact.email}
                      </>
                    )}
                  </span>
                ),
                href: `/${locale}/contacts/${m.contact_id}`,
              })}
            />

            {/* Desktop (md+): DataTable */}
            <div className="hidden md:block">
              <DataTable
                columns={[
                  pt.name,
                  pt.role,
                  pt.contact,
                  { label: pt.addedOn, align: "right" },
                ]}
              >
                {members.map((m) => (
                  <DataTable.Row key={m.id}>
                    <DataTable.Cell>
                      <Link
                        href={`/${locale}/contacts/${m.contact_id}`}
                        className="font-medium hover:text-primary"
                      >
                        {displayName(m)}
                      </Link>
                      {m.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {m.notes}
                        </p>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Badge variant={ROLE_VARIANT[m.role] ?? "default"}>
                        {pt.roles[m.role] ?? m.role}
                      </Badge>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {m.contact.email && (
                        <a
                          href={`mailto:${m.contact.email}`}
                          className="block text-xs text-primary hover:text-primary/80"
                        >
                          {m.contact.email}
                        </a>
                      )}
                      {m.contact.phone && (
                        <span className="block text-xs text-muted-foreground">
                          {m.contact.phone}
                        </span>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell align="right">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString(locale)}
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
