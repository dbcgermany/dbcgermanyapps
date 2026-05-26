import { notFound } from "next/navigation";
import { affiliateEnabled } from "@dbc/affiliate";
import { createServerClient } from "@dbc/supabase/server";
import { Badge } from "@dbc/ui";
import { listEligiblePayoutAggregatesAction } from "@/actions/affiliates";
import { PageHeader } from "@/components/page-header";
import { StatGrid } from "@/components/stat-grid";
import { StatCard } from "@/components/stat-card";
import { PayoutQueueClient } from "./payouts-client";

export default async function PayoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!affiliateEnabled()) notFound();
  const { locale } = await params;

  const supabase = await createServerClient();
  const [eligibles, { data: recentPayouts }] = await Promise.all([
    listEligiblePayoutAggregatesAction(),
    supabase
      .from("affiliate_payouts")
      .select(
        `id, amount_cents, currency, status, paid_at, payment_reference, created_at,
         affiliates ( id, display_name, contact_email )`
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const totalPending = eligibles.reduce((s, a) => s + a.total_cents, 0);

  return (
    <div>
      <PageHeader
        title="Affiliate payouts"
        description="Generate statements and mark payouts as paid once the bank transfer settles."
        back={{ href: `/${locale}/affiliates`, label: "Affiliates" }}
      />
      <div className="mt-6">
        <StatGrid cols={4}>
          <StatCard
            label="Affiliates pending"
            value={String(eligibles.length)}
          />
          <StatCard
            label="Total owed (eligible)"
            value={new Intl.NumberFormat(
              locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
              { style: "currency", currency: "EUR" }
            ).format(totalPending / 100)}
          />
          <StatCard
            label="Recent payouts"
            value={String(recentPayouts?.length ?? 0)}
          />
          <StatCard
            label="Min payout"
            value="Set per-affiliate via notes"
            dense
          />
        </StatGrid>
      </div>

      <div className="mt-6">
        <PayoutQueueClient eligibles={eligibles} locale={locale} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold">Recent payouts</h2>
        {(recentPayouts ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(recentPayouts ?? []).map((p) => {
                const aff = p.affiliates as unknown as {
                  id: string;
                  display_name: string;
                  contact_email: string;
                };
                return (
                  <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="font-semibold">
                        {aff?.display_name ?? "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {" · "}
                        {new Date(p.created_at).toLocaleDateString(locale)}
                        {p.payment_reference
                          ? ` · ref ${p.payment_reference}`
                          : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono">
                        {new Intl.NumberFormat(
                          locale === "de"
                            ? "de-DE"
                            : locale === "fr"
                            ? "fr-FR"
                            : "en-US",
                          { style: "currency", currency: p.currency }
                        ).format(p.amount_cents / 100)}
                      </span>
                      <Badge
                        variant={
                          p.status === "paid"
                            ? "success"
                            : p.status === "cancelled"
                            ? "error"
                            : "warning"
                        }
                      >
                        {p.status}
                      </Badge>
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
