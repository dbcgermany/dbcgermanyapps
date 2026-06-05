"use client";

import { useTranslations } from "next-intl";
import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
import { EditableList } from "@/components/editable-list";
import { reorderNewsCategories } from "@/actions/news-categories";
import { CategoryRow, type NewsCategory } from "./category-row";

export function CategoriesSortable({ categories }: { categories: NewsCategory[] }) {
  const t = useTranslations("admin.news.categories");

  if (categories.length === 0) {
    return (
      <EditableList isEmpty emptyMessage={t("empty")} className="mt-6">
        {null}
      </EditableList>
    );
  }

  return (
    <SortableList
      items={categories}
      caption={t("reorderHint")}
      onReorder={async (ids) => {
        await reorderNewsCategories(ids);
      }}
      renderItem={(category, handle) => (
        <div ref={handle.setNodeRef} style={handle.style}>
          <CategoryRow
            category={category}
            dragHandle={<DragHandle {...handle.attributes} {...handle.listeners} />}
          />
        </div>
      )}
    />
  );
}
