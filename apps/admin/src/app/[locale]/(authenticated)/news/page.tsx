import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Card, LinkButton } from "@dbc/ui";
import { getNewsPosts, toggleNewsPublish } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ActionForm } from "@/components/action-form";

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.news.list" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);
  const posts = await getNewsPosts();

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={
          <LinkButton href={`/${locale}/news/new`}>
            {t("newPost")}
          </LinkButton>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          message={t("empty")}
          cta={{ label: t("newPost"), href: `/${locale}/news/new` }}
          className="mt-12"
        />
      ) : (
        <div className="mt-8 space-y-3">
          {posts.map((p) => (
            <Card
              key={p.id}
              padding="sm"
              className="flex items-center justify-between rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/${locale}/news/${p.id}`} className="font-medium hover:text-primary">{p.title_en}</Link>
                  <Badge variant={p.is_published ? "success" : "warning"}>
                    {p.is_published ? t("published") : t("draft")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {p.slug} ·{" "}
                  {new Date(p.created_at).toLocaleDateString(locale)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/news/${p.id}`}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  {t("edit")}
                </Link>
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
                  errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
                >
                  <button
                    type="submit"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {p.is_published ? t("unpublish") : t("publish")}
                  </button>
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
