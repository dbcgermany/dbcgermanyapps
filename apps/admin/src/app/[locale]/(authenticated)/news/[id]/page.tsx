import { getNewsPost, toggleNewsPublish, deleteNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { EditNewsForm } from "./edit-form";

const T = {
  en: { title: "Edit post", publish: "Publish", unpublish: "Unpublish", delete: "Delete" },
  de: { title: "Beitrag bearbeiten", publish: "Veröffentlichen", unpublish: "Zurückziehen", delete: "Löschen" },
  fr: { title: "Modifier le billet", publish: "Publier", unpublish: "Dépublier", delete: "Supprimer" },
} as const;

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const post = await getNewsPost(id);

  return (
    <div>
      <PageHeader
        title={t.title}
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
                {post.is_published ? t.unpublish : t.publish}
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
                {t.delete}
              </button>
            </form>
          </div>
        }
      />

      <EditNewsForm locale={locale} post={post} />
    </div>
  );
}
