import Link from "next/link";
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
  const members = await getTeamMembers();

  return (
    <div>
      <PageHeader
        title="Team profiles"
        description="Public team page content. Drag rows to reorder; the order here is the order shown on dbc-germany.com/team. Set visibility per member: public shows on the public team page, internal is admin-only, hidden archives the row."
        cta={
          <Link
            href={`/${locale}/team/new`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            New team member
          </Link>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          message="No team members yet."
          cta={{ label: "New team member", href: `/${locale}/team/new` }}
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
