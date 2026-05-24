"use client";

import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
import { reorderEventMedia } from "@/actions/media";
import { MediaRow } from "./media-row";

type Item = Parameters<typeof MediaRow>[0]["item"];

export function MediaSortable({
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
      caption="Drag the handle to reorder. Gallery order on the public event page follows this list."
      onReorder={async (ids) => {
        const result = await reorderEventMedia(eventId, ids, locale);
        if ("error" in result && result.error) return { error: result.error };
      }}
      renderItem={(item, handle) => (
        <div ref={handle.setNodeRef} style={handle.style}>
          <MediaRow
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
