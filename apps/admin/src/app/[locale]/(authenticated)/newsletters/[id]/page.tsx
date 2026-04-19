import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  getNewsletter,
  listContactCategories,
  getNewsletterStats,
} from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import { NewsletterComposer } from "../composer";

const T = {
  en: {
    untitled: "(untitled)",
    statusLabel: "Status",
    analytics: "Delivery analytics",
    delivered: "Delivered", opened: "Opened", clicked: "Clicked",
    bouncedFailed: "Bounced / Failed",
    unsubscribe: "unsubscribe since send",
    unsubscribes: "unsubscribes since send",
  },
  de: {
    untitled: "(ohne Titel)",
    statusLabel: "Status",
    analytics: "Versand-Analytics",
    delivered: "Zugestellt", opened: "Geöffnet", clicked: "Geklickt",
    bouncedFailed: "Bounced / Fehlgeschlagen",
    unsubscribe: "Abmeldung seit Versand",
    unsubscribes: "Abmeldungen seit Versand",
  },
  fr: {
    untitled: "(sans titre)",
    statusLabel: "Statut",
    analytics: "Analytique d’envoi",
    delivered: "Délivrés", opened: "Ouverts", clicked: "Cliqués",
    bouncedFailed: "Rejetés / Échoués",
    unsubscribe: "désabonnement depuis l’envoi",
    unsubscribes: "désabonnements depuis l’envoi",
  },
} as const;

export default async function NewsletterEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
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
      <PageHeader
        title={nl.subject || t.untitled}
        description={`${t.statusLabel}: ${nl.status}`}
        back={{ href: `/${locale}/newsletters`, label: tBack("newsletters") }}
      />

      {/* Delivery analytics */}
      {stats && (
        <section className="mt-6">
          <h2 className="font-heading text-lg font-semibold">
            {t.analytics}
          </h2>
          <div className="mt-3">
            <StatGrid cols={4}>
              <StatCard label={t.delivered} value={String(stats.delivered)} dense />
              <StatCard
                label={t.opened}
                value={`${stats.opened} (${stats.openRate}%)`}
                dense
              />
              <StatCard
                label={t.clicked}
                value={`${stats.clicked} (${stats.clickRate}%)`}
                dense
              />
              <StatCard
                label={t.bouncedFailed}
                value={String(stats.bounced)}
                dense
              />
            </StatGrid>
          </div>
          {stats.unsubscribed > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.unsubscribed} {stats.unsubscribed === 1 ? t.unsubscribe : t.unsubscribes}
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
