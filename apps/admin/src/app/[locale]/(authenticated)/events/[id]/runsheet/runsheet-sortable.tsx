"use client";

import { SortableList } from "@/components/sortable-list";
import { DragHandle } from "@/components/inline-edit-row";
import { reorderRunsheetItems } from "@/actions/runsheet";
import type { ProgramItem, ProgramItemOwnerSpeaker, ProgramItemOwnerTeamMember, ProgramItemOwnerContact } from "@dbc/types";
import { RunsheetRow } from "./runsheet-row";

export function RunsheetSortable({
  items,
  eventId,
  locale,
  staff,
  speakerOptions,
  teamMemberOptions,
  contactOptions,
}: {
  items: ProgramItem[];
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
  speakerOptions: (ProgramItemOwnerSpeaker & { is_event_speaker?: boolean })[];
  teamMemberOptions: ProgramItemOwnerTeamMember[];
  contactOptions: ProgramItemOwnerContact[];
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
            speakerOptions={speakerOptions}
            teamMemberOptions={teamMemberOptions}
            contactOptions={contactOptions}
            dragHandle={
              <DragHandle {...handle.attributes} {...handle.listeners} />
            }
          />
        </div>
      )}
    />
  );
}
