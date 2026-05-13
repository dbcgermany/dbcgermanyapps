import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  deleteSpeaker,
  getLinkedTeamMember,
  getSpeaker,
  getTeamMembersForLinking,
} from "@/actions/speakers";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
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
  const [teamMembers, linkedTeam, tCommon] = await Promise.all([
    getTeamMembersForLinking(),
    speaker.team_member_id
      ? getLinkedTeamMember(speaker.team_member_id)
      : Promise.resolve(null),
    getTranslations({ locale, namespace: "admin.common" }),
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
        cta={
          <ActionForm
            action={async () => {
              "use server";
              return deleteSpeaker(id, locale);
            }}
            successToast={tCommon("deletedToast")}
            errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
          >
            <button
              type="submit"
              className="rounded-md border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              {tCommon("delete")}
            </button>
          </ActionForm>
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
