import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@dbc/ui";
import { listFunnels } from "@/actions/funnels";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddButton } from "@/components/add-button";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";
import { captureServerError } from "@/lib/observe";

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
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.funnels.list" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);
  let funnels: Awaited<ReturnType<typeof listFunnels>> = [];
  let loadError: string | null = null;
  try {
    funnels = await listFunnels();
  } catch (err) {
    captureServerError(err, { scope: "funnels.listPage", data: { locale } });
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={<AddButton href={`/${locale}/funnels/new`} label={t("newFunnel")} />}
      />

      {loadError ? (
        <div className="mt-8 rounded-lg border border-danger-border bg-danger-soft/40 p-4 text-sm">
          <p className="font-medium text-danger">Couldn&apos;t load funnels</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{loadError}</p>
        </div>
      ) : funnels.length === 0 ? (
        <EmptyState
          message={t("empty")}
          cta={{ label: t("newFunnel"), href: `/${locale}/funnels/new` }}
          className="mt-12"
        />
      ) : (
        <>
          {/* Mobile: shared MobileList */}
          <MobileList
            className="mt-8 md:hidden"
            items={funnels}
            renderCell={(f) => {
              const heroTitle =
                f.content_en?.hero?.title ??
                f.content_de?.hero?.title ??
                f.content_fr?.hero?.title ??
                f.slug;
              const ctr = f.views_7d > 0 ? f.cta_clicks_7d / f.views_7d : 0;
              const statusLabel =
                f.status === "published"
                  ? t("published")
                  : f.status === "archived"
                    ? t("archived")
                    : t("draft");
              return {
                id: f.id,
                title: heroTitle,
                meta: (
                  <span>
                    <span className="block truncate">
                      /f/{f.slug}
                    </span>
                    <span className="mt-1 block">
                      {f.views_7d} {t("views7d")} · {f.cta_clicks_7d}{" "}
                      {t("clicks7d")} · {formatPercent(ctr)} {t("ctr7d")}
                    </span>
                  </span>
                ),
                trailing: (
                  <Badge variant={statusVariant(f.status)}>{statusLabel}</Badge>
                ),
                href: `/${locale}/funnels/${f.id}`,
              };
            }}
          />

          {/* Desktop: shared DataTable */}
          <div className="mt-8 hidden md:block">
            <DataTable
              columns={[
                t("title"),
                "Slug",
                { label: t("views7d"), align: "right" },
                { label: t("clicks7d"), align: "right" },
                { label: t("ctr7d"), align: "right" },
                tCommon("status"),
              ]}
            >
              {funnels.map((f) => {
                const heroTitle =
                  f.content_en?.hero?.title ??
                  f.content_de?.hero?.title ??
                  f.content_fr?.hero?.title ??
                  f.slug;
                const ctr = f.views_7d > 0 ? f.cta_clicks_7d / f.views_7d : 0;
                const statusLabel =
                  f.status === "published"
                    ? t("published")
                    : f.status === "archived"
                      ? t("archived")
                      : t("draft");
                return (
                  <DataTable.Row key={f.id}>
                    <DataTable.Cell>
                      <Link
                        href={`/${locale}/funnels/${f.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {heroTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <Badge variant="accent" className="mr-2">
                          {t(`ctaType.${f.cta_type}`)}
                        </Badge>
                        {new Date(f.updated_at).toLocaleDateString(locale)}
                      </p>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-muted-foreground">
                      /f/{f.slug}
                    </DataTable.Cell>
                    <DataTable.Cell align="right" className="tabular-nums">
                      {f.views_7d}
                    </DataTable.Cell>
                    <DataTable.Cell align="right" className="tabular-nums">
                      {f.cta_clicks_7d}
                    </DataTable.Cell>
                    <DataTable.Cell align="right" className="tabular-nums">
                      {formatPercent(ctr)}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Badge variant={statusVariant(f.status)}>
                        {statusLabel}
                      </Badge>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
