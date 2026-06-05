import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCompanyInfo, formatOfficeAddress } from "@dbc/legal";
import {
  getNewsletter,
  getNewsletterSenderDomainStatus,
  listContactCategories,
  getNewsletterStats,
} from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import { NewsletterComposer } from "../composer";

export default async function NewsletterEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "admin.newsletters.detail" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [nl, categories, domainStatus, info] = await Promise.all([
    getNewsletter(id),
    listContactCategories(),
    getNewsletterSenderDomainStatus(),
    getCompanyInfo(),
  ]);
  if (!nl) notFound();
  const companyFooter = [
    [info?.legal_name, info?.legal_form].filter(Boolean).join(" "),
    formatOfficeAddress(info, { oneLine: true }),
  ]
    .filter(Boolean)
    .join(" · ");

  const stats =
    nl.status === "sent" || nl.status === "sending"
      ? await getNewsletterStats(id)
      : null;

  return (
    <div>
      <PageHeader
        title={nl.subject || t("untitled")}
        description={`${t("statusLabel")}: ${nl.status}`}
        back={{ href: `/${locale}/newsletters`, label: tBack("newsletters") }}
      />

      {/* Delivery analytics */}
      {stats && (
        <section className="mt-6">
          <h2 className="font-heading text-lg font-semibold">
            {t("analytics")}
          </h2>
          <div className="mt-3">
            <StatGrid cols={4}>
              <StatCard label={t("delivered")} value={String(stats.delivered)} dense />
              <StatCard
                label={t("opened")}
                value={`${stats.opened} (${stats.openRate}%)`}
                dense
              />
              <StatCard
                label={t("clicked")}
                value={`${stats.clicked} (${stats.clickRate}%)`}
                dense
              />
              <StatCard
                label={t("bouncedFailed")}
                value={String(stats.bounced)}
                dense
              />
            </StatGrid>
          </div>
          {stats.unsubscribed > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.unsubscribed} {stats.unsubscribed === 1 ? t("unsubscribe") : t("unsubscribes")}
            </p>
          )}
        </section>
      )}

      <NewsletterComposer
        uiLocale={locale}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name_en }))}
        initial={{
          id: nl.id,
          subject: nl.subject ?? "",
          preheader: nl.preheader ?? "",
          body_mdx: nl.body_mdx ?? "",
          body_html: nl.body_html ?? "",
          from_name: nl.from_name ?? "DBC Germany",
          from_email: nl.from_email ?? "newsletter@dbc-germany.com",
          reply_to: nl.reply_to ?? "",
          locale: nl.locale ?? "en",
          target_category_slugs: nl.target_category_slugs ?? [],
          exclude_category_slugs: nl.exclude_category_slugs ?? [],
        }}
        readOnly={nl.status !== "draft"}
        domainStatus={domainStatus}
        companyFooter={companyFooter}
      />
    </div>
  );
}
