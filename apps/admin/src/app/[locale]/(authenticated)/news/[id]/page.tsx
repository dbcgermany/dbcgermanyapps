import { getTranslations } from "next-intl/server";
import { getNewsPost, toggleNewsPublish, deleteNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
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
  const [tBack, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);
  const post = await getNewsPost(id);

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/news`, label: tBack("news") }}
        cta={
          <div className="flex items-center gap-3">
            <ActionForm
              action={async () => {
                "use server";
                return toggleNewsPublish(id, locale);
              }}
              successToast={
                post.is_published
                  ? tCommon("unpublishedToast")
                  : tCommon("publishedToast")
              }
              errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {post.is_published ? t.unpublish : t.publish}
              </button>
            </ActionForm>
            <ActionForm
              action={async () => {
                "use server";
                return deleteNewsPost(id, locale);
              }}
              successToast={tCommon("deletedToast")}
              errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
            >
              <button
                type="submit"
                className="rounded-md border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
              >
                {t.delete}
              </button>
            </ActionForm>
          </div>
        }
      />

      <EditNewsForm locale={locale} post={post} />
    </div>
  );
}
