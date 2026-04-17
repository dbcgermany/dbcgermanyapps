import { TeamMemberForm } from "../member-form";

export default async function NewTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">New team member</h1>
      <TeamMemberForm locale={locale} mode="create" />
    </div>
  );
}
