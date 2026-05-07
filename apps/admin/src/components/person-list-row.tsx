import Link from "next/link";
import type { ReactNode } from "react";

// Shared row primitive for admin person lists (team, speakers global, event
// speakers). Replaces three near-identical hand-rolled rows. Mobile-first:
// avatar + identity stack always wraps below the action cluster on narrow
// viewports, the identity text truncates instead of forcing horizontal scroll,
// and the action cluster wraps within itself when there are many controls.
//
// Drag handles (sortable rows) are passed in as a `dragHandle` slot so this
// component stays presentational — SortableList still owns the dnd refs/style.

export interface PersonListRowProps {
  /** Stable id used for keying. */
  id: string;
  /** Optional drag handle (button + setNodeRef wrapper) rendered before the avatar. */
  dragHandle?: ReactNode;
  /** Avatar URL. When null, initials are rendered as a fallback chip. */
  photoUrl: string | null;
  /** Used for the initials fallback when photoUrl is null. */
  initialsName: string;
  /** Primary display name (rendered as a link if `nameHref` is set). */
  name: string;
  nameHref?: string;
  /** Status / visibility / featured chips rendered next to the name. */
  badges?: ReactNode;
  /** Single muted line below the name (e.g. role · sort · email). */
  subtitle?: ReactNode;
  /** Right-side action cluster (selects, edit/remove buttons). */
  actions?: ReactNode;
  /** Anything that should appear below the row (inline edit forms, etc.). */
  footer?: ReactNode;
  /** Forwarded by SortableList to attach the dnd setNodeRef on the outer wrapper. */
  outerRef?: (node: HTMLElement | null) => void;
  /** Style forwarded by dnd-kit (transform/transition). */
  outerStyle?: React.CSSProperties;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PersonListRow({
  dragHandle,
  photoUrl,
  initialsName,
  name,
  nameHref,
  badges,
  subtitle,
  actions,
  footer,
  outerRef,
  outerStyle,
}: PersonListRowProps) {
  const NameTag = nameHref ? Link : "span";
  const nameProps = nameHref ? { href: nameHref } : {};

  return (
    <div
      ref={outerRef}
      style={outerStyle}
      className="rounded-lg border border-border bg-background p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        {/* Identity cluster: handle + avatar + name/badges/subtitle */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {dragHandle}
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
              {initialsOf(initialsName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <NameTag
                {...(nameProps as { href: string })}
                className="truncate font-medium hover:text-primary"
              >
                {name}
              </NameTag>
              {badges}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action cluster: wraps within itself when crowded */}
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>

      {footer}
    </div>
  );
}
