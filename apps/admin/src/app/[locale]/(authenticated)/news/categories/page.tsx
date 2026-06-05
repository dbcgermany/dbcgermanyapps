import { getTranslations } from "next-intl/server";
import { getNewsCategories } from "@/actions/news-categories";
import { PageHeader } from "@/components/page-header";
import { CategoryAddForm } from "./category-add-form";
import { CategoriesSortable } from "./categories-sortable";
import type { NewsCategory } from "./category-row";

export default async function NewsCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tBack] = await Promise.all([
    getTranslations({ locale, namespace: "admin.news.categories" }),
    getTranslations({ locale, namespace: "admin.back" }),
  ]);
  const categories = (await getNewsCategories()) as NewsCategory[];

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/news`, label: tBack("news") }}
      />
      <div className="mt-6">
        <CategoriesSortable categories={categories} />
      </div>
      <CategoryAddForm />
    </div>
  );
}
