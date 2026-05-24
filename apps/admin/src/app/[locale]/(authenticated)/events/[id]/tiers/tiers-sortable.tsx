"use client";

import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
import { reorderTiers } from "@/actions/tiers";
import { TierRow } from "./tier-row";

type Tier = Parameters<typeof TierRow>[0]["tier"];

export function TiersSortable({
  tiers,
  eventId,
  locale,
}: {
  tiers: Tier[];
  eventId: string;
  locale: string;
}) {
  return (
    <SortableList
      items={tiers}
      caption="Drag the handle to reorder. Tier order is shown to buyers on the checkout page and reports. Saves automatically."
      onReorder={async (ids) => {
        const result = await reorderTiers(eventId, ids, locale);
        if ("error" in result && result.error) return { error: result.error };
      }}
      renderItem={(tier, handle) => (
        <div ref={handle.setNodeRef} style={handle.style}>
          <TierRow
            tier={tier}
            eventId={eventId}
            locale={locale}
            dragHandle={
              <DragHandle
                {...handle.attributes}
                {...handle.listeners}
              />
            }
          />
        </div>
      )}
    />
  );
}
