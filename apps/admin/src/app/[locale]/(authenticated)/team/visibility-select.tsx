"use client";

import { useTransition } from "react";
import {
  setTeamMemberVisibility,
  type TeamMemberVisibility,
} from "@/actions/team";

const OPTIONS: TeamMemberVisibility[] = ["public", "internal", "hidden"];

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
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
