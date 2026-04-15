"use client";

import { SortableList } from "@/components/sortable-list";
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
            <TierRow tier={tier} eventId={eventId} locale={locale} />
          </div>
        </div>
      )}
    />
  );
}
