import { LinkButton } from "@dbc/ui";
import { getTeamMembers } from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TeamSortableList } from "./team-sortable-list";

const T = {
  en: {
    title: "Team profiles",
    description:
      "Public team page content. Drag rows to reorder; the order here is the order shown on dbc-germany.com/team. Set visibility per member: public shows on the public team page, internal is admin-only, hidden archives the row.",
    newMember: "New team member",
    empty: "No team members yet.",
  },
  de: {
    title: "Team-Profile",
    description:
      "Inhalte der öffentlichen Team-Seite. Per Drag & Drop sortieren; die Reihenfolge hier entspricht der auf dbc-germany.com/team. Sichtbarkeit pro Person setzen: „öffentlich“ erscheint auf der Team-Seite, „intern“ ist nur im Admin sichtbar, „ausgeblendet“ archiviert.",
    newMember: "Neues Teammitglied",
    empty: "Noch keine Teammitglieder.",
  },
  fr: {
    title: "Profils de l’équipe",
    description:
      "Contenu de la page équipe publique. Glissez-déposez pour réordonner ; l’ordre ici est celui de dbc-germany.com/team. Définissez la visibilité par personne : « public » apparaît sur la page équipe publique, « interne » est visible uniquement dans l’admin, « masqué » archive l’entrée.",
    newMember: "Nouveau membre",
    empty: "Aucun membre pour le moment.",
  },
} as const;

export default async function TeamListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const members = await getTeamMembers();

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        cta={
          <LinkButton href={`/${locale}/team/new`}>
            {t.newMember}
          </LinkButton>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          message={t.empty}
          cta={{ label: t.newMember, href: `/${locale}/team/new` }}
          className="mt-12"
        />
      ) : (
        <div className="mt-8">
          <TeamSortableList initial={members} locale={locale} />
        </div>
      )}
    </div>
  );
}
