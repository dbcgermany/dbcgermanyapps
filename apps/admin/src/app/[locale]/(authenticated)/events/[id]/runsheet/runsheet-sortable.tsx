"use client";

import { SortableList } from "@/components/sortable-list";
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
        <div
          ref={handle.setNodeRef}
          style={handle.style}
          className="flex items-stretch gap-3 rounded-lg border border-border bg-background p-1"
        >
          <button
            type="button"
            aria-label="Drag to reorder"
            className="flex w-8 shrink-0 cursor-grab items-center justify-center self-stretch rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
            {...handle.attributes}
            {...handle.listeners}
          >
            <span aria-hidden>⋮⋮</span>
          </button>
          <div className="min-w-0 flex-1">
            <RunsheetRow
              item={item}
              eventId={eventId}
              locale={locale}
              staff={staff}
            />
          </div>
        </div>
      )}
    />
  );
}
