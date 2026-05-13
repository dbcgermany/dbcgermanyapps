import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@dbc/supabase/server";
import { PageHeader } from "@/components/page-header";
import { listEventTeamInvites } from "@/actions/team-friend-invites";
import { getEvent } from "@/actions/events";
import { TeamInvitesClient } from "./team-invites-client";

interface EventTeamInviteRow {
  team_invite_quota?: number | null;
  team_invite_discount_type?: "percent" | "fixed" | null;
  team_invite_discount_value?: number | null;
  team_invite_applicable_tier_ids?: string[] | null;
}

export default async function EventTeamInvitesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createServerClient();
  const [event, summaries, t, tBack, tiersData] = await Promise.all([
    getEvent(id),
    listEventTeamInvites(id),
    getTranslations({ locale, namespace: "admin.teamInvites" }),
    getTranslations({ locale, namespace: "admin.back" }),
    supabase
      .from("ticket_tiers")
      .select("id, name_en, name_de, name_fr, price_cents, is_public, counts_as_sold")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
  ]);
  const tierOptions = (tiersData.data ?? [])
    .filter((t) => t.is_public && t.counts_as_sold)
    .map((t) => ({
      id: t.id,
      label:
        (locale === "de" && t.name_de) ||
        (locale === "fr" && t.name_fr) ||
        t.name_en,
      priceCents: t.price_cents,
    }));
  const e = event as typeof event & EventTeamInviteRow;
  const discountType = (e.team_invite_discount_type ?? "percent") as
    | "percent"
    | "fixed";
  const discountValue = e.team_invite_discount_value ?? 0;
  const applicableTierIds = e.team_invite_applicable_tier_ids ?? [];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />

      {discountValue <= 0 && (
        <div className="mt-6 rounded-lg border border-warning-border bg-warning-soft/40 p-4 text-sm">
          <p className="font-medium text-warning">
            {t("notConfiguredTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("notConfiguredHintFlex")}{" "}
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
        defaultDiscountType={discountType}
        defaultDiscountValue={discountValue}
        defaultApplicableTierIds={applicableTierIds}
        tierOptions={tierOptions}
        summaries={summaries}
      />
    </div>
  );
}
