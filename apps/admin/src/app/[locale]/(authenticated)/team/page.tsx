import { getTranslations } from "next-intl/server";
import { LinkButton } from "@dbc/ui";
import { getTeamMembers } from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TeamSortableList } from "./team-sortable-list";

export default async function TeamListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.team.list" });
  const members = await getTeamMembers();

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        cta={
          <LinkButton href={`/${locale}/team/new`}>
            {t("newMember")}
          </LinkButton>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          message={t("empty")}
          cta={{ label: t("newMember"), href: `/${locale}/team/new` }}
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
