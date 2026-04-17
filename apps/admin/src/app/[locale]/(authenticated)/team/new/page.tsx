import Link from "next/link";
import { getStaffAccountsForLinking } from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

export default async function NewTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const staffAccounts = await getStaffAccountsForLinking();

  return (
    <div>
      <Link
        href={`/${locale}/team`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Team
      </Link>
      <PageHeader title="New team member" />
      <TeamMemberForm locale={locale} mode="create" staffAccounts={staffAccounts} />
    </div>
  );
}
