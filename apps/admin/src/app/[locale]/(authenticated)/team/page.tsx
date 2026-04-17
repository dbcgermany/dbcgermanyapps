import Link from "next/link";
import { getTeamMembers } from "@/actions/team";
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Team profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public team page content. Drag rows to reorder; the order here is
            the order shown on dbc-germany.com/team. Set visibility per member:{" "}
            <code>public</code> shows on the public team page,{" "}
            <code>internal</code> is admin-only, <code>hidden</code> archives
            the row.
          </p>
        </div>
        <Link
          href={`/${locale}/team/new`}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          New team member
        </Link>
      </div>

      {members.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          No team members yet.
        </p>
      ) : (
        <div className="mt-8">
          <TeamSortableList initial={members} locale={locale} />
        </div>
      )}
    </div>
  );
}
