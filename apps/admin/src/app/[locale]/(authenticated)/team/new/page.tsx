import { getTranslations } from "next-intl/server";
import { getStaffAccountsForLinking } from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

export default async function NewTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.team.new" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const staffAccounts = await getStaffAccountsForLinking();

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/team`, label: tBack("team") }}
      />
      <TeamMemberForm locale={locale} mode="create" staffAccounts={staffAccounts} />
    </div>
  );
}
