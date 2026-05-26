import { notFound } from "next/navigation";
import Link from "next/link";
import { affiliateEnabled } from "@dbc/affiliate";
import { Badge } from "@dbc/ui";
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
    <div>
      <PageHeader
        title="Affiliates"
        description="External marketing partners. Banking handled offline — store payment refs in the affiliate's notes."
        back={{ href: `/${locale}/dashboard`, label: "Dashboard" }}
        cta={<AffiliatesIndexActions />}
      />

      <div className="mt-6">
        <StatGrid cols={4}>
          <StatCard label="Active" value={String(counts.active)} />
          <StatCard label="Invited" value={String(counts.invited)} />
          <StatCard label="Paused" value={String(counts.paused)} />
          <StatCard label="Total" value={String(counts.total)} />
        </StatGrid>
      </div>

      {affiliates.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No affiliates yet. Click <strong>New affiliate</strong> above to add
            one. To enroll an affiliate in a specific event, open the event and
            use the <strong>Affiliate marketing</strong> card.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {affiliates.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
