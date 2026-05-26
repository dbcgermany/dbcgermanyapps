import { notFound } from "next/navigation";
import { affiliateEnabled } from "@dbc/affiliate";
import { createServerClient } from "@dbc/supabase/server";
import {
  getAffiliateAction,
  listPayoutsForAffiliateAction,
} from "@/actions/affiliates";
import { PageHeader } from "@/components/page-header";
import { AffiliateDetailClient } from "./affiliate-detail-client";

export default async function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!affiliateEnabled()) notFound();
  const { locale, id } = await params;
  const aff = await getAffiliateAction(id);
  if (!aff) notFound();

  const supabase = await createServerClient();
  const [{ data: enrollments }, payouts] = await Promise.all([
    supabase
      .from("event_affiliates")
      .select(
        `id, event_id, commission_pct, status, dashboard_token, token_expires_at, token_revoked_at,
         events ( id, title_en, title_de, title_fr, starts_at, ends_at, slug ),
         coupons ( code )`
      )
      .eq("affiliate_id", id)
      .order("created_at", { ascending: false }),
    listPayoutsForAffiliateAction(id),
  ]);

  return (
    <div>
      <PageHeader
        title={aff.display_name}
        description={aff.contact_email}
        back={{ href: `/${locale}/affiliates`, label: "Affiliates" }}
      />
      <div className="mt-6">
        <AffiliateDetailClient
          affiliate={aff}
          enrollments={(enrollments ?? []) as never[]}
          payouts={payouts}
          locale={locale}
        />
      </div>
    </div>
  );
}
