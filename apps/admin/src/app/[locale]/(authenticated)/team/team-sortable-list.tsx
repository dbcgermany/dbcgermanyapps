"use client";

import { Badge } from "@dbc/ui";
import { SortableList } from "@/components/sortable-list";
import { PersonListRow } from "@/components/person-list-row";
import type { TeamMember } from "@/actions/team";
import { reorderTeamMembers } from "@/actions/team";
import { VisibilitySelect } from "./visibility-select";

function visibilityVariant(
  visibility: TeamMember["visibility"]
): "success" | "warning" | "default" {
  return visibility === "public"
    ? "success"
    : visibility === "internal"
      ? "warning"
      : "default";
}

const VIS_LABELS = {
  en: { public: "Public", internal: "Internal", hidden: "Hidden" },
  de: { public: "Öffentlich", internal: "Intern", hidden: "Versteckt" },
  fr: { public: "Public", internal: "Interne", hidden: "Masqué" },
} as const;

function visibilityLabel(
  visibility: TeamMember["visibility"],
  locale: string
): string {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  return VIS_LABELS[l][visibility as keyof typeof VIS_LABELS.en] ?? visibility;
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
        <PersonListRow
          id={member.id}
          outerRef={handle.setNodeRef}
          outerStyle={handle.style}
          dragHandle={
            <button
              type="button"
              aria-label="Drag to reorder"
              className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted active:cursor-grabbing"
              {...handle.attributes}
              {...handle.listeners}
            >
              <span aria-hidden>⋮⋮</span>
            </button>
          }
          photoUrl={member.photo_url}
          initialsName={member.name}
          name={member.name}
          nameHref={`/${locale}/team/${member.id}`}
          badges={
            <Badge variant={visibilityVariant(member.visibility)}>
              {visibilityLabel(member.visibility, locale)}
            </Badge>
          }
          subtitle={
            <>
              {member.role_en} · sort {member.sort_order}
              {member.email && ` · ${member.email}`}
            </>
          }
          actions={
            <>
              <VisibilitySelect
                id={member.id}
                current={member.visibility}
                locale={locale}
              />
              <a
                href={`/${locale}/team/${member.id}`}
                className="text-xs text-primary hover:text-primary/80"
              >
                Edit
              </a>
            </>
          }
        />
      )}
    />
  );
}
