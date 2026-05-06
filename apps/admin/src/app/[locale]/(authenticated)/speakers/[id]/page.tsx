import { notFound } from "next/navigation";
import {
  getLinkedTeamMember,
  getSpeaker,
  getTeamMembersForLinking,
} from "@/actions/speakers";
import { PageHeader } from "@/components/page-header";
import { SpeakerForm } from "../speaker-form";

export default async function EditSpeakerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  let speaker;
  try {
    speaker = await getSpeaker(id);
  } catch {
    return notFound();
  }
  const [teamMembers, linkedTeam] = await Promise.all([
    getTeamMembersForLinking(),
    speaker.team_member_id
      ? getLinkedTeamMember(speaker.team_member_id)
      : Promise.resolve(null),
  ]);
  return (
    <div>
      <PageHeader
        title={`${speaker.first_name} ${speaker.last_name}`}
        description={
          speaker.title_en
            ? speaker.title_en +
              (speaker.company_en ? ` · ${speaker.company_en}` : "")
            : "Speaker profile"
        }
      />
      <SpeakerForm
        mode="edit"
        locale={locale}
        speaker={speaker}
        teamMembers={teamMembers}
        linkedTeam={linkedTeam}
      />
    </div>
  );
}
