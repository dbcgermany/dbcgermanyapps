"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableItem {
  id: string;
}

export interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (orderedIds: string[]) => Promise<{ error?: string } | void>;
  renderItem: (item: T, handleProps: HandleProps, isDragging: boolean) => React.ReactNode;
  className?: string;
  /** Caption text above the list (e.g. "Drag to reorder. Saves automatically."). */
  caption?: React.ReactNode;
}

// Intentionally loose — @dnd-kit's own types are heavy and not worth re-exporting.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandleAttributes = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandleListeners = Record<string, any> | undefined;

export interface HandleProps {
  attributes: HandleAttributes;
  listeners: HandleListeners;
  setNodeRef: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
}

/**
 * Headless @dnd-kit wrapper. Caller supplies the row renderer and wires the
 * drag handle via `handleProps` on whichever element should be grabbable.
 *
 * Usage:
 *   <SortableList
 *     items={tiers}
 *     onReorder={(ids) => reorderTiers(eventId, ids)}
 *     renderItem={(tier, handle, isDragging) => (
 *       <div ref={handle.setNodeRef} style={handle.style} className={...}>
 *         <button {...handle.attributes} {...handle.listeners}>⋮⋮</button>
 *         <span>{tier.name}</span>
 *       </div>
 *     )}
 *   />
 */
export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  className,
  caption,
}: SortableListProps<T>) {
  const [local, setLocal] = React.useState(items);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Keep local state in sync when the server sends a fresh list.
  React.useEffect(() => {
    setLocal(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = local.findIndex((m) => m.id === active.id);
    const newIndex = local.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const before = local;
    const next = arrayMove(local, oldIndex, newIndex);
    setLocal(next);
    setError(null);

    startTransition(async () => {
      const result = await onReorder(next.map((m) => m.id));
      if (result && "error" in result && result.error) {
        setError(result.error);
        setLocal(before);
      }
    });
  }

  return (
    <div className={className}>
      {caption && (
        <p className="mb-3 text-xs text-muted-foreground">
          {caption}
          {isPending && <span className="ml-2 text-primary">Saving…</span>}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={local.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {local.map((item) => (
              <SortableRow key={item.id} id={item.id}>
                {(handle, isDragging) => renderItem(item, handle, isDragging)}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handle: HandleProps, isDragging: boolean) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return <>{children({ attributes, listeners, setNodeRef, style }, isDragging)}</>;
}
