import { notFound } from "next/navigation";
import Link from "next/link";
import { affiliateEnabled } from "@dbc/affiliate";
import { Badge, Card } from "@dbc/ui";
import { listAffiliatesAction } from "@/actions/affiliates";
import { PageHeader } from "@/components/page-header";
import { StatGrid } from "@/components/stat-grid";
import { StatCard } from "@/components/stat-card";
import { AffiliatesIndexActions } from "./affiliates-index-client";

export default async function AffiliatesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!affiliateEnabled()) notFound();
  const { locale } = await params;
  const affiliates = await listAffiliatesAction();
  const counts = {
    active: affiliates.filter((a) => a.status === "active").length,
    invited: affiliates.filter((a) => a.status === "invited").length,
    paused: affiliates.filter((a) => a.status === "paused").length,
    total: affiliates.length,
  };

  return (
    <>
      <PageHeader
        title="Affiliates"
        description="External marketing partners. Banking is handled offline — store payment refs in the affiliate's notes."
        back={{ href: `/${locale}/dashboard`, label: "Dashboard" }}
      />
      <div className="space-y-6">
        <StatGrid cols={4}>
          <StatCard label="Active" value={String(counts.active)} />
          <StatCard label="Invited" value={String(counts.invited)} />
          <StatCard label="Paused" value={String(counts.paused)} />
          <StatCard label="Total" value={String(counts.total)} />
        </StatGrid>

        <div className="flex justify-end">
          <AffiliatesIndexActions />
        </div>

        {affiliates.length === 0 ? (
          <Card padding="md">
            <p className="text-sm text-muted-foreground">
              No affiliates yet. Click &ldquo;New affiliate&rdquo; to add one.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {affiliates.map((a) => (
              <Card key={a.id} padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/${locale}/affiliates/${a.id}`}
                      className="text-base font-semibold hover:underline"
                    >
                      {a.display_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {a.contact_email}
                      {a.country ? ` · ${a.country}` : ""} · {a.preferred_locale}
                    </p>
                  </div>
                  <Badge
                    variant={
                      a.status === "active"
                        ? "success"
                        : a.status === "invited"
                        ? "info"
                        : a.status === "paused"
                        ? "warning"
                        : "default"
                    }
                  >
                    {a.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          To enroll someone in a specific event, open the event and use the
          &ldquo;Affiliate marketing&rdquo; card.
        </p>
      </div>
    </>
  );
}
