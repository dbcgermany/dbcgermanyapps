import { getTeamMembersForLinking } from "@/actions/speakers";
import { PageHeader } from "@/components/page-header";
import { SpeakerForm } from "../speaker-form";

export default async function NewSpeakerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const teamMembers = await getTeamMembersForLinking();
  return (
    <div>
      <PageHeader title="New speaker" description="Add a speaker to the global library." />
      <div className="mt-6">
        <SpeakerForm mode="create" locale={locale} teamMembers={teamMembers} />
      </div>
    </div>
  );
}
