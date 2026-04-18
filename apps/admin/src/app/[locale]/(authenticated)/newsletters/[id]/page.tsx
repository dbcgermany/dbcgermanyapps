import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getNewsletter,
  listContactCategories,
  getNewsletterStats,
} from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { NewsletterComposer } from "../composer";

export default async function NewsletterEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [nl, categories] = await Promise.all([
    getNewsletter(id),
    listContactCategories(),
  ]);
  if (!nl) notFound();

  const stats =
    nl.status === "sent" || nl.status === "sending"
      ? await getNewsletterStats(id)
      : null;

  return (
    <div>
      <Link
        href={`/${locale}/newsletters`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; All newsletters
      </Link>
      <PageHeader
        title={nl.subject || "(untitled)"}
        description={`Status: ${nl.status}`}
        className="mt-3"
      />

      {/* Delivery analytics */}
      {stats && (
        <section className="mt-6">
          <h2 className="font-heading text-lg font-semibold">
            Delivery analytics
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Delivered" value={String(stats.delivered)} dense />
            <StatCard
              label="Opened"
              value={`${stats.opened} (${stats.openRate}%)`}
              dense
            />
            <StatCard
              label="Clicked"
              value={`${stats.clicked} (${stats.clickRate}%)`}
              dense
            />
            <StatCard
              label="Bounced / Failed"
              value={String(stats.bounced)}
              dense
            />
          </div>
          {stats.unsubscribed > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.unsubscribed} unsubscribe
              {stats.unsubscribed === 1 ? "" : "s"} since send
            </p>
          )}
        </section>
      )}

      <NewsletterComposer
        categories={categories.map((c) => ({ slug: c.slug, name: c.name_en }))}
        initial={{
          id: nl.id,
          subject: nl.subject ?? "",
          preheader: nl.preheader ?? "",
          body_mdx: nl.body_mdx ?? "",
          from_name: nl.from_name ?? "DBC Germany",
          from_email: nl.from_email ?? "newsletter@dbc-germany.com",
          reply_to: nl.reply_to ?? "",
          locale: nl.locale ?? "en",
          target_category_slugs: nl.target_category_slugs ?? [],
          exclude_category_slugs: nl.exclude_category_slugs ?? [],
        }}
        readOnly={nl.status !== "draft"}
      />
    </div>
  );
}
