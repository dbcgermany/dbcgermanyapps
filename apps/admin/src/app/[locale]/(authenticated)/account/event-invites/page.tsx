import { getTranslations } from "next-intl/server";
import { requireRole } from "@dbc/supabase/server";
import { createServerClient } from "@dbc/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EventInvitesClient } from "./event-invites-client";

export default async function EventInvitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  const t = await getTranslations({
    locale,
    namespace: "admin.eventInvites",
  });

  // Active events with a team-friend program configured + this user is a
  // staff role. We deliberately don't gate on "has tickets sold" — admin
  // can preview slots as soon as the program is wired.
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, slug, title_en, title_de, title_fr, starts_at, ends_at, team_invite_quota, team_invite_tier_id, team_invite_tier:ticket_tiers!events_team_invite_tier_id_fkey(id, name_en, name_de, price_cents)"
    )
    .gte("ends_at", new Date().toISOString())
    .not("team_invite_tier_id", "is", null)
    .order("starts_at", { ascending: true });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <EventInvitesClient
        locale={locale}
        userId={user.userId}
        events={(events ?? []).map((e) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tier = (e as any).team_invite_tier;
          return {
            id: e.id,
            slug: e.slug,
            title:
              ((e[`title_${locale}` as keyof typeof e] as string) ||
                e.title_en) ?? "",
            startsAt: e.starts_at,
            quota: e.team_invite_quota ?? 3,
            targetTierName: tier
              ? (locale === "de" && tier.name_de) || tier.name_en
              : null,
            targetPriceEur: tier
              ? (tier.price_cents / 100).toFixed(2)
              : null,
          };
        })}
      />
    </div>
  );
}
