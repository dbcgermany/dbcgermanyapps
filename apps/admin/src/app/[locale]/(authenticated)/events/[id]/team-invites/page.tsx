import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { listEventTeamInvites } from "@/actions/team-friend-invites";
import { getEvent } from "@/actions/events";
import { TeamInvitesClient } from "./team-invites-client";

export default async function EventTeamInvitesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [event, summaries] = await Promise.all([
    getEvent(id),
    listEventTeamInvites(id),
  ]);

  return (
    <div>
      <PageHeader
        title="Team-friend invites"
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: "Event" }}
      />

      {!event.team_invite_tier_id && (
        <div className="mt-6 rounded-lg border border-warning-border bg-warning-soft/40 p-4 text-sm">
          <p className="font-medium text-warning">
            Team-friend invites aren&apos;t configured for this event.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open{" "}
            <Link
              href={`/${locale}/events/${id}/edit`}
              className="underline hover:text-primary"
            >
              event settings
            </Link>{" "}
            and pick a target tier under <em>Guest program configuration</em>.
          </p>
        </div>
      )}

      <TeamInvitesClient
        eventId={id}
        defaultQuota={event.team_invite_quota ?? 3}
        summaries={summaries}
      />
    </div>
  );
}
