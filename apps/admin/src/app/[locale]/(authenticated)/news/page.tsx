import Link from "next/link";
import { Badge, Card } from "@dbc/ui";
import { getNewsPosts, toggleNewsPublish } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = await getNewsPosts();

  return (
    <div>
      <PageHeader
        title="News"
        cta={
          <Link
            href={`/${locale}/news/new`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            New post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          message="No posts yet. Create the first one."
          cta={{ label: "New post", href: `/${locale}/news/new` }}
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
                  <p className="font-medium">{p.title_en}</p>
                  <Badge variant={p.is_published ? "success" : "warning"}>
                    {p.is_published ? "Published" : "Draft"}
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
                  Edit
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
                    {p.is_published ? "Unpublish" : "Publish"}
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
