import { getNewsPost, toggleNewsPublish, deleteNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { EditNewsForm } from "./edit-form";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const post = await getNewsPost(id);

  return (
    <div>
      <PageHeader
        title="Edit post"
        cta={
          <div className="flex items-center gap-3">
            <form
              action={async () => {
                "use server";
                await toggleNewsPublish(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {post.is_published ? "Unpublish" : "Publish"}
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteNewsPost(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </form>
          </div>
        }
      />

      <EditNewsForm locale={locale} post={post} />
    </div>
  );
}
