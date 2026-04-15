"use client";

import { SortableList } from "@/components/sortable-list";
import { reorderScheduleItems } from "@/actions/schedule";
import { ScheduleRow } from "./schedule-row";

type Item = Parameters<typeof ScheduleRow>[0]["item"];

export function ScheduleSortable({
  items,
  eventId,
  locale,
}: {
  items: Item[];
  eventId: string;
  locale: string;
}) {
  return (
    <SortableList
      items={items}
      caption="Drag the handle to reorder. The runsheet on the public event page uses this order."
      onReorder={async (ids) => {
        const result = await reorderScheduleItems(eventId, ids, locale);
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
            <ScheduleRow item={item} eventId={eventId} locale={locale} />
          </div>
        </div>
      )}
    />
  );
}
