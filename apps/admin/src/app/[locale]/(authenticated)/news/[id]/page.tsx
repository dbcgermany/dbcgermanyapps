import { getTranslations } from "next-intl/server";
import { getNewsPost, toggleNewsPublish, deleteNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { ToggleButton } from "@/components/toggle-button";
import { DeleteButton } from "@/components/delete-button";
import { EditNewsForm } from "./edit-form";

const T = {
  en: {
    title: "Edit post",
    publish: "Publish",
    unpublish: "Unpublish",
    delete: "Delete",
    deleteConfirm: "Delete this post?",
    deleteConfirmHint: "This permanently removes the post and its translations.",
    deletedToast: "Post deleted",
  },
  de: {
    title: "Beitrag bearbeiten",
    publish: "Veröffentlichen",
    unpublish: "Zurückziehen",
    delete: "Löschen",
    deleteConfirm: "Diesen Beitrag löschen?",
    deleteConfirmHint:
      "Der Beitrag und alle Übersetzungen werden dauerhaft entfernt.",
    deletedToast: "Beitrag gelöscht",
  },
  fr: {
    title: "Modifier le billet",
    publish: "Publier",
    unpublish: "Dépublier",
    delete: "Supprimer",
    deleteConfirm: "Supprimer ce billet ?",
    deleteConfirmHint:
      "Le billet et toutes ses traductions seront définitivement supprimés.",
    deletedToast: "Billet supprimé",
  },
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
          <div className="flex items-center gap-2">
            <ToggleButton
              isOn={post.is_published}
              onLabel={t.unpublish}
              offLabel={t.publish}
              action={async () => {
                "use server";
                return toggleNewsPublish(id, locale);
              }}
              onToast={tCommon("unpublishedToast")}
              offToast={tCommon("publishedToast")}
            />
            <DeleteButton
              action={async () => deleteNewsPost(id, locale)}
              confirmTitle={t.deleteConfirm}
              confirmDescription={t.deleteConfirmHint}
              confirmLabel={t.delete}
              label={t.delete}
              successToast={t.deletedToast}
            />
          </div>
        }
      />

      <EditNewsForm locale={locale} post={post} />
    </div>
  );
}
