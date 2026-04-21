"use client";

import { useTransition } from "react";
import {
  TEAM_MEMBER_VISIBILITY_VALUES,
  type TeamMemberVisibility,
} from "@dbc/types";
import { setTeamMemberVisibility } from "@/actions/team";

const LABELS: Record<string, Record<TeamMemberVisibility, string>> = {
  en: { public: "Public", internal: "Internal", hidden: "Hidden" },
  de: { public: "\u00d6ffentlich", internal: "Intern", hidden: "Versteckt" },
  fr: { public: "Public", internal: "Interne", hidden: "Masqu\u00e9" },
};

export function VisibilitySelect({
  id,
  current,
  locale,
}: {
  id: string;
  current: TeamMemberVisibility;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const labels =
    LABELS[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TeamMemberVisibility;
    startTransition(async () => {
      await setTeamMemberVisibility(id, next, locale);
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {TEAM_MEMBER_VISIBILITY_VALUES.map((o) => (
        <option key={o} value={o}>
          {labels[o]}
        </option>
      ))}
    </select>
  );
}
