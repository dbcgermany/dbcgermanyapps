import { getTranslations } from "next-intl/server";
import { getAuthors } from "@/actions/authors";
import { PageHeader } from "@/components/page-header";
import { AuthorAddForm } from "./author-add-form";
import { AuthorsSortable } from "./authors-sortable";
import type { Author } from "./author-row";

export default async function NewsAuthorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tBack] = await Promise.all([
    getTranslations({ locale, namespace: "admin.news.authors" }),
    getTranslations({ locale, namespace: "admin.back" }),
  ]);
  const authors = (await getAuthors()) as Author[];

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/news`, label: tBack("news") }}
      />
      <div className="mt-6">
        <AuthorsSortable authors={authors} />
      </div>
      <AuthorAddForm />
    </div>
  );
}
