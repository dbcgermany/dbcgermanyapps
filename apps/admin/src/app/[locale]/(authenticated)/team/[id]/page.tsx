import Link from "next/link";
import { Badge } from "@dbc/ui";
import {
  getTeamMember,
  deleteTeamMember,
  getStaffAccountsForLinking,
} from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [member, staffAccounts] = await Promise.all([
    getTeamMember(id),
    getStaffAccountsForLinking(id),
  ]);

  return (
    <div>
      <Link
        href={`/${locale}/team`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Team
      </Link>

      <PageHeader
        title={member.name}
        description={member.profile_id ? "Linked to staff account" : "No staff account linked"}
        cta={
          <div className="flex items-center gap-3">
            {member.profile_id && (
              <Link
                href={`/${locale}/staff/${member.profile_id}`}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                View staff profile &rarr;
              </Link>
            )}
            <Badge variant={member.visibility === "public" ? "success" : member.visibility === "internal" ? "warning" : "default"}>
              {member.visibility}
            </Badge>
            <form
              action={async () => {
                "use server";
                await deleteTeamMember(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </form>
          </div>
        }
      />
      <TeamMemberForm
        locale={locale}
        mode="edit"
        initial={member}
        staffAccounts={staffAccounts}
      />
    </div>
  );
}
