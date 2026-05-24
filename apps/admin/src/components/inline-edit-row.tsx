"use client";

import { useState, type ReactNode } from "react";
import { GripVertical, Pencil, X } from "lucide-react";
import { Button, Card } from "@dbc/ui";

/**
 * SSOT row pattern for editable lists. Collapses the duplicated
 * `useState("view" | "edit")` toggle in tier-row, coupon-row, sponsor card,
 * schedule-row, runsheet-row, media-row, email-row into one primitive.
 *
 * The caller provides:
 *  - `title` + `badges` + `meta`: how the collapsed row reads
 *  - `renderEdit({ close })`: the inline edit form, given a close handle
 *  - `actions?`: extra per-row actions next to Edit/Delete (e.g. Activate)
 *  - `deleteAction?`: a <DeleteButton compact /> (or any ReactNode)
 *  - `dragHandle?`: render-prop receiving handle props from SortableList
 *
 * Visual contract:
 *  - View mode: Card with title row, optional badges/meta, Edit + Delete buttons on the right
 *  - Edit mode: Card with header row + the form below; Cancel button replaces Edit
 *
 * Same Card, same paddings, same button positions on every page.
 */
export function InlineEditRow({
  title,
  badges,
  meta,
  actions,
  deleteAction,
  renderEdit,
  dragHandle,
  defaultEditing = false,
}: {
  title: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  deleteAction?: ReactNode;
  renderEdit?: (helpers: { close: () => void }) => ReactNode;
  dragHandle?: ReactNode;
  defaultEditing?: boolean;
}) {
  const [editing, setEditing] = useState(defaultEditing);
  const canEdit = Boolean(renderEdit);

  return (
    <Card padding="sm" className="border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {dragHandle && (
            <span className="mt-1 shrink-0 text-muted-foreground" aria-hidden>
              {dragHandle}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{title}</div>
              {badges}
            </div>
            {meta && (
              <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing((v) => !v)}
              title={editing ? "Cancel" : "Edit"}
            >
              {editing ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Pencil className="h-4 w-4" aria-hidden />
              )}
              <span className="sr-only">{editing ? "Cancel" : "Edit"}</span>
            </Button>
          )}
          {deleteAction}
        </div>
      </div>

      {editing && canEdit && (
        <div className="mt-4 border-t border-border pt-4">
          {renderEdit?.({ close: () => setEditing(false) })}
        </div>
      )}
    </Card>
  );
}

/**
 * Default drag-handle visual for SortableList rows. Pair with the handle
 * props from SortableList: <DragHandle {...handle.attributes} {...handle.listeners} />.
 */
export function DragHandle(
  props: React.HTMLAttributes<HTMLSpanElement> & { ref?: React.Ref<HTMLSpanElement> }
) {
  return (
    <span
      className="cursor-grab touch-none rounded p-1 hover:bg-muted active:cursor-grabbing"
      role="button"
      tabIndex={0}
      aria-label="Drag to reorder"
      {...props}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
    </span>
  );
}
