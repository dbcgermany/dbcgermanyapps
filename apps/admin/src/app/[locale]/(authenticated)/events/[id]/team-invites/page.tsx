import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
  const [event, summaries, t, tBack] = await Promise.all([
    getEvent(id),
    listEventTeamInvites(id),
    getTranslations({ locale, namespace: "admin.teamInvites" }),
    getTranslations({ locale, namespace: "admin.back" }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />

      {!event.team_invite_tier_id && (
        <div className="mt-6 rounded-lg border border-warning-border bg-warning-soft/40 p-4 text-sm">
          <p className="font-medium text-warning">
            {t("notConfiguredTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("notConfiguredHint")}{" "}
            <Link
              href={`/${locale}/events/${id}/edit`}
              className="underline hover:text-primary"
            >
              {t("eventSettingsLink")}
            </Link>
            .
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
