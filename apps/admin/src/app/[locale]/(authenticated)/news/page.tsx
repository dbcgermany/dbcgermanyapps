import Link from "next/link";
import { getNewsPosts, toggleNewsPublish } from "@/actions/news";

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = await getNewsPosts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">News</h1>
        <Link
          href={`/${locale}/news/new`}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          No posts yet. Create the first one.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.title_en}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.is_published
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {p.is_published ? "Published" : "Draft"}
                  </span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
