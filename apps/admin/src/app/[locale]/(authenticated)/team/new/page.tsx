import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

export default async function NewTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <PageHeader title="New team member" />
      <TeamMemberForm locale={locale} mode="create" />
    </div>
  );
}
