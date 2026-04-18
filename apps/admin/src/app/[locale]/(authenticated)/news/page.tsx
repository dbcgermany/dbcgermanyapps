import Link from "next/link";
import { Badge, Card } from "@dbc/ui";
import { getNewsPosts, toggleNewsPublish } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

const T = {
  en: {
    title: "News", newPost: "New post",
    empty: "No posts yet. Create the first one.",
    published: "Published", draft: "Draft",
    edit: "Edit", publish: "Publish", unpublish: "Unpublish",
  },
  de: {
    title: "Aktuelles", newPost: "Neuer Beitrag",
    empty: "Noch keine Beiträge. Erstellen Sie den ersten.",
    published: "Veröffentlicht", draft: "Entwurf",
    edit: "Bearbeiten", publish: "Veröffentlichen", unpublish: "Zurückziehen",
  },
  fr: {
    title: "Actualités", newPost: "Nouveau billet",
    empty: "Aucun billet pour le moment. Créez le premier.",
    published: "Publié", draft: "Brouillon",
    edit: "Modifier", publish: "Publier", unpublish: "Dépublier",
  },
} as const;

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const posts = await getNewsPosts();

  return (
    <div>
      <PageHeader
        title={t.title}
        cta={
          <Link
            href={`/${locale}/news/new`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t.newPost}
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          message={t.empty}
          cta={{ label: t.newPost, href: `/${locale}/news/new` }}
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
                    {p.is_published ? t.published : t.draft}
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
                  {t.edit}
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await toggleNewsPublish(p.id, locale);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {p.is_published ? t.unpublish : t.publish}
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
