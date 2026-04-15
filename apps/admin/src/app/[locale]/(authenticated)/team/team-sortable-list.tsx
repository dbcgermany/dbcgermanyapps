"use client";

import Link from "next/link";
import { SortableList } from "@/components/sortable-list";
import type { TeamMember } from "@/actions/team";
import { reorderTeamMembers } from "@/actions/team";
import { VisibilitySelect } from "./visibility-select";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function badgeClass(visibility: TeamMember["visibility"]) {
  return visibility === "public"
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : visibility === "internal"
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-muted text-muted-foreground";
}

export function TeamSortableList({
  initial,
  locale,
}: {
  initial: TeamMember[];
  locale: string;
}) {
  return (
    <SortableList
      items={initial}
      caption="Drag the handle on the left to reorder. The order here is exactly the order shown on dbc-germany.com/team. Saves automatically."
      onReorder={async (ids) => {
        const result = await reorderTeamMembers(ids, locale);
        if (result?.error) return { error: result.error };
      }}
      renderItem={(member, handle) => (
        <div
          ref={handle.setNodeRef}
          style={handle.style}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Drag to reorder"
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted active:cursor-grabbing"
              {...handle.attributes}
              {...handle.listeners}
            >
              <span aria-hidden>⋮⋮</span>
            </button>
            {member.photo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={member.photo_url}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                {initialsOf(member.name)}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{member.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(member.visibility)}`}
                >
                  {member.visibility}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {member.role_en} · sort {member.sort_order}
                {member.email && ` · ${member.email}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VisibilitySelect
              id={member.id}
              current={member.visibility}
              locale={locale}
            />
            <Link
              href={`/${locale}/team/${member.id}`}
              className="text-xs text-primary hover:text-primary/80"
            >
              Edit
            </Link>
          </div>
        </div>
      )}
    />
  );
}
