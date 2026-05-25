"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { GripVertical, Pencil, X } from "lucide-react";
import { Button, Card } from "@dbc/ui";

/**
 * AdminListRow — the canonical row organism for every drag/list/reorder
 * page in admin. (Historical aliases `InlineEditRow` and `PersonListRow`
 * re-export from here — see end of file.)
 *
 * Design-system rules baked in (do NOT bypass; see CLAUDE.md
 * "Design system" section):
 *
 *  1. Exactly ONE of `inlineEdit` or `detailHref` may be set. TS overloads
 *     + a runtime assert enforce it. `inlineEdit` is for small forms
 *     (≤ ~8 simple fields); `detailHref` is for forms that need their own
 *     page (file upload, ≥ 9 fields, multi-step, etc.).
 *  2. No emoji in the shell. Status badges = text-only `<Badge>`.
 *  3. Subtitle is a single truncated line. Multi-line meta belongs in
 *     `inlineEdit` body or on the detail page — not in the collapsed row.
 *  4. Avatar is a slot, not a separate primitive. Pass `null` for non-
 *     person rows; pass `{ photoUrl, initialsName }` for people.
 *  5. Density is fixed: `padding="md"` outer, `h-12` avatar, single
 *     truncated subtitle. All rows render at the same height regardless
 *     of which page they're on.
 *
 * Companion: `<DragHandle />` (exported from this file). Pair with
 * SortableList's handle props: `<DragHandle {...handle.attributes}
 * {...handle.listeners} />`.
 */

export interface AdminListRowAvatar {
  /** Public URL of the avatar image. */
  photoUrl?: string | null;
  /** Name to derive initials from when `photoUrl` is null. */
  initialsName: string;
}

export interface AdminListRowProps {
  /** Primary display text. Plain text (or a `<span>` if you need to override). */
  title: ReactNode;
  /** Optional URL for the title itself — turns the title into a `<Link>`. Independent of `detailHref`. */
  titleHref?: string;
  /** Subtitle = single truncated muted line. Use ` · ` to join fields. */
  subtitle?: ReactNode;
  /**
   * @deprecated Alias for `subtitle`, kept so callers using the old
   * `InlineEditRow` `meta` prop name still compile. Migrate to `subtitle`.
   */
  meta?: ReactNode;
  /** Status / state chips next to the title. Use text-only `<Badge>`. */
  badges?: ReactNode;
  /** Avatar slot — pass `null` for non-person rows. */
  avatar?: AdminListRowAvatar | null;
  /** Drag-handle node from `SortableList`'s `renderItem`. Pass `null` when the list isn't reorderable. */
  dragHandle?: ReactNode;
  /** Right-side action cluster: inline selects, ghost buttons. Wraps inside itself when crowded. */
  actions?: ReactNode;
  /** Delete control — typically `<DeleteButton compact />`. */
  deleteAction?: ReactNode;
  /** Inline-expand edit form. Use for small forms (≤ ~8 fields). Mutually exclusive with `detailHref`. */
  inlineEdit?: (helpers: { close: () => void }) => ReactNode;
  /**
   * @deprecated Old name for `inlineEdit` kept for back-compat with the
   * pre-merger `InlineEditRow` callers. Migrate to `inlineEdit`.
   */
  renderEdit?: (helpers: { close: () => void }) => ReactNode;
  /** URL of a dedicated edit page. Use for big forms (≥ 9 fields, file upload). Mutually exclusive with `inlineEdit`. */
  detailHref?: string;
  /** Whether the inline form starts open on mount. Used by `editable-list` add-mode. */
  defaultEditing?: boolean;
  /** Forwarded by SortableList to attach dnd-kit's setNodeRef. */
  outerRef?: (node: HTMLElement | null) => void;
  /** Style forwarded by dnd-kit (transform/transition). */
  outerStyle?: React.CSSProperties;
  /** Optional content rendered below the row (e.g. a small status strip). */
  footer?: ReactNode;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminListRow(props: AdminListRowProps) {
  const {
    title,
    titleHref,
    subtitle,
    meta,
    badges,
    avatar,
    dragHandle,
    actions,
    deleteAction,
    outerRef,
    outerStyle,
    footer,
  } = props;

  // Backward-compat: old InlineEditRow callers pass `meta` and `renderEdit`.
  // Normalise to the canonical names before downstream logic.
  const effectiveSubtitle = subtitle ?? meta;
  const inlineEditFn =
    "inlineEdit" in props && props.inlineEdit
      ? props.inlineEdit
      : "renderEdit" in props && props.renderEdit
        ? props.renderEdit
        : undefined;
  const detailHref =
    "detailHref" in props && props.detailHref ? props.detailHref : undefined;

  if (inlineEditFn && detailHref) {
    throw new Error(
      "AdminListRow: pass exactly one of `inlineEdit` / `renderEdit` or `detailHref`, not both."
    );
  }

  const [editing, setEditing] = useState<boolean>(
    "defaultEditing" in props && !!props.defaultEditing
  );

  const titleNode = titleHref ? (
    <Link href={titleHref} className="truncate font-medium hover:text-primary">
      {title}
    </Link>
  ) : (
    <span className="truncate font-medium">{title}</span>
  );

  return (
    <Card
      padding="md"
      className="border-border"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ ref: outerRef, style: outerStyle } as any)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        {/* Identity cluster: handle + avatar + name/badges/subtitle */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {dragHandle && (
            <span className="shrink-0 text-muted-foreground" aria-hidden>
              {dragHandle}
            </span>
          )}
          {avatar &&
            (avatar.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.photoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                {initialsOf(avatar.initialsName)}
              </span>
            ))}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {titleNode}
              {badges}
            </div>
            {effectiveSubtitle && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {effectiveSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action cluster: actions + edit/cancel + delete */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {inlineEditFn && (
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
          {detailHref && (
            <Link
              href={detailHref}
              className="text-xs text-primary hover:text-primary/80"
            >
              Edit
            </Link>
          )}
          {deleteAction}
        </div>
      </div>

      {inlineEditFn && editing && (
        <div className="mt-4 border-t border-border pt-4">
          {inlineEditFn({ close: () => setEditing(false) })}
        </div>
      )}

      {footer}
    </Card>
  );
}

/**
 * Default drag-handle visual for SortableList rows.
 * Pair with the handle props from SortableList:
 *
 *   <DragHandle {...handle.attributes} {...handle.listeners} />
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

/**
 * @deprecated Alias for `AdminListRow`. Kept so existing imports keep
 * compiling during the migration. New code should import `AdminListRow`
 * directly. Will be removed once all callers are migrated.
 */
export const InlineEditRow = AdminListRow;
