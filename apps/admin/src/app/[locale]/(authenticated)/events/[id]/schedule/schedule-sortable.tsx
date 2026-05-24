"use client";

import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
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
        <div ref={handle.setNodeRef} style={handle.style}>
          <ScheduleRow
            item={item}
            eventId={eventId}
            locale={locale}
            dragHandle={
              <DragHandle {...handle.attributes} {...handle.listeners} />
            }
          />
        </div>
      )}
    />
  );
}
