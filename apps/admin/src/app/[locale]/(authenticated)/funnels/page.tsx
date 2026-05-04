import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Card, LinkButton } from "@dbc/ui";
import { listFunnels } from "@/actions/funnels";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

function statusVariant(status: "draft" | "published" | "archived") {
  if (status === "published") return "success" as const;
  if (status === "archived") return "default" as const;
  return "warning" as const;
}

function formatPercent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function FunnelsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.funnels.list" });
  const funnels = await listFunnels();

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={<LinkButton href={`/${locale}/funnels/new`}>{t("newFunnel")}</LinkButton>}
      />

      {funnels.length === 0 ? (
        <EmptyState
          message={t("empty")}
          cta={{ label: t("newFunnel"), href: `/${locale}/funnels/new` }}
          className="mt-12"
        />
      ) : (
        <div className="mt-8 space-y-3">
          {funnels.map((f) => {
            const heroTitle =
              f.content_en?.hero?.title ??
              f.content_de?.hero?.title ??
              f.content_fr?.hero?.title ??
              f.slug;
            const ctr = f.views_7d > 0 ? f.cta_clicks_7d / f.views_7d : 0;
            const statusLabel =
              f.status === "published" ? t("published") : f.status === "archived" ? t("archived") : t("draft");
            return (
              <Card
                key={f.id}
                padding="sm"
                className="flex flex-col gap-3 rounded-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/${locale}/funnels/${f.id}`}
                      className="truncate font-medium hover:text-primary"
                    >
                      {heroTitle}
                    </Link>
                    <Badge variant={statusVariant(f.status)}>{statusLabel}</Badge>
                    <Badge variant="accent">{t(`ctaType.${f.cta_type}`)}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    /f/{f.slug} · {new Date(f.updated_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">{f.views_7d}</span>{" "}
                    {t("views7d")}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{f.cta_clicks_7d}</span>{" "}
                    {t("clicks7d")}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{formatPercent(ctr)}</span>{" "}
                    {t("ctr7d")}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
