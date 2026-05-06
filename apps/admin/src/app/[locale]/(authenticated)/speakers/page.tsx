import { LinkButton } from "@dbc/ui";
import { getSpeakers } from "@/actions/speakers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SpeakersList } from "./speakers-list";

export default async function SpeakersListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const speakers = await getSpeakers();

  return (
    <div>
      <PageHeader
        title="Speakers"
        description="Global speakers library. Each speaker can be attached to one or more events. Speakers linked to a team member inherit bio, photo and contact details from /team."
        cta={
          <LinkButton href={`/${locale}/speakers/new`}>New speaker</LinkButton>
        }
      />

      {speakers.length === 0 ? (
        <EmptyState
          message="No speakers yet. Add the first one to populate event line-ups."
          cta={{ label: "New speaker", href: `/${locale}/speakers/new` }}
          className="mt-12"
        />
      ) : (
        <div className="mt-8">
          <SpeakersList initial={speakers} locale={locale} />
        </div>
      )}
    </div>
  );
}
