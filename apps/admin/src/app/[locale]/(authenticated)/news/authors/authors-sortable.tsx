"use client";

import { useTranslations } from "next-intl";
import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
import { EditableList } from "@/components/editable-list";
import { reorderAuthors } from "@/actions/authors";
import { AuthorRow, type Author } from "./author-row";

export function AuthorsSortable({ authors }: { authors: Author[] }) {
  const t = useTranslations("admin.news.authors");

  if (authors.length === 0) {
    return (
      <EditableList isEmpty emptyMessage={t("empty")} className="mt-6">
        {null}
      </EditableList>
    );
  }

  return (
    <SortableList
      items={authors}
      caption={t("reorderHint")}
      onReorder={async (ids) => {
        await reorderAuthors(ids);
      }}
      renderItem={(author, handle) => (
        <div ref={handle.setNodeRef} style={handle.style}>
          <AuthorRow
            author={author}
            dragHandle={<DragHandle {...handle.attributes} {...handle.listeners} />}
          />
        </div>
      )}
    />
  );
}
