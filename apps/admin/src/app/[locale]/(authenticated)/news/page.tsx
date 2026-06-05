import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, LinkButton } from "@dbc/ui";
import { getNewsPosts, toggleNewsPublish } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ActionForm } from "@/components/action-form";
import { AddButton } from "@/components/add-button";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tCommon, tCat] = await Promise.all([
    getTranslations({ locale, namespace: "admin.news.list" }),
    getTranslations({ locale, namespace: "admin.common" }),
    getTranslations({ locale, namespace: "admin.news.categories" }),
  ]);
  const posts = await getNewsPosts();

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton href={`/${locale}/news/categories`} variant="secondary">
              {tCat("manage")}
            </LinkButton>
            <AddButton href={`/${locale}/news/new`} label={t("newPost")} />
          </div>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          message={t("empty")}
          cta={{ label: t("newPost"), href: `/${locale}/news/new` }}
          className="mt-12"
        />
      ) : (
        <>
          {/* Mobile: shared MobileList */}
          <MobileList
            className="mt-8 md:hidden"
            items={posts}
            renderCell={(p) => ({
              id: p.id,
              title: p.title_en,
              meta: (
                <span>
                  {p.slug} ·{" "}
                  {new Date(p.created_at).toLocaleDateString(locale)}
                </span>
              ),
              trailing: (
                <Badge variant={p.is_published ? "success" : "warning"}>
                  {p.is_published ? t("published") : t("draft")}
                </Badge>
              ),
              href: `/${locale}/news/${p.id}`,
            })}
          />

          {/* Desktop: shared DataTable */}
          <div className="mt-8 hidden md:block">
            <DataTable
              columns={[
                t("title"),
                "Slug",
                tCommon("created"),
                tCommon("status"),
                { label: tCommon("actions"), align: "right" },
              ]}
            >
              {posts.map((p) => (
                <DataTable.Row key={p.id}>
                  <DataTable.Cell>
                    <Link
                      href={`/${locale}/news/${p.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {p.title_en}
                    </Link>
                  </DataTable.Cell>
                  <DataTable.Cell className="text-muted-foreground">
                    {p.slug}
                  </DataTable.Cell>
                  <DataTable.Cell className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString(locale)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Badge variant={p.is_published ? "success" : "warning"}>
                      {p.is_published ? t("published") : t("draft")}
                    </Badge>
                  </DataTable.Cell>
                  <DataTable.Cell align="right">
                    <ActionForm
                      action={async () => {
                        "use server";
                        return toggleNewsPublish(p.id, locale);
                      }}
                      successToast={
                        p.is_published
                          ? tCommon("unpublishedToast")
                          : tCommon("publishedToast")
                      }
                      errorToastTemplate={tCommon("actionFailedToast", {
                        error: "{error}",
                      })}
                    >
                      <button
                        type="submit"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {p.is_published ? t("unpublish") : t("publish")}
                      </button>
                    </ActionForm>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
