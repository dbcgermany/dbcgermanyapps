import Link from "next/link";
import { Badge } from "@dbc/ui";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "admin.team.detail" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [member, staffAccounts] = await Promise.all([
    getTeamMember(id),
    getStaffAccountsForLinking(id),
  ]);

  return (
    <div>
      <PageHeader
        title={member.name}
        description={member.profile_id ? t("linked") : t("notLinked")}
        back={{ href: `/${locale}/team`, label: tBack("team") }}
        cta={
          <div className="flex items-center gap-3">
            {member.profile_id && (
              <Link
                href={`/${locale}/staff/${member.profile_id}`}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t("viewStaff")}
              </Link>
            )}
            <Badge variant={member.visibility === "public" ? "success" : member.visibility === "internal" ? "warning" : "default"}>
              {t(`visibility.${member.visibility}`)}
            </Badge>
            <form
              action={async () => {
                "use server";
                await deleteTeamMember(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
              >
                {t("delete")}
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
