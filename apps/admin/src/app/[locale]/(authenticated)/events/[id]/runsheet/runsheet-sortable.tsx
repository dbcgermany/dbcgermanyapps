"use client";

import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
import { reorderRunsheetItems, type RunsheetItem } from "@/actions/runsheet";
import { RunsheetRow } from "./runsheet-row";

export function RunsheetSortable({
  items,
  eventId,
  locale,
  staff,
}: {
  items: RunsheetItem[];
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
}) {
  return (
    <SortableList
      items={items}
      caption="Drag the handle to reorder. Order is preserved when exporting the PDF."
      onReorder={async (ids) => {
        const result = await reorderRunsheetItems(eventId, ids, locale);
        if ("error" in result && result.error) return { error: result.error };
      }}
      renderItem={(item, handle) => (
        <div ref={handle.setNodeRef} style={handle.style}>
          <RunsheetRow
            item={item}
            eventId={eventId}
            locale={locale}
            staff={staff}
            dragHandle={
              <DragHandle {...handle.attributes} {...handle.listeners} />
            }
          />
        </div>
      )}
    />
  );
}
