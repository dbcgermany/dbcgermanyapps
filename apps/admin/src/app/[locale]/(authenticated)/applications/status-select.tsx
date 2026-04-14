"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/actions/applications";

const STATUSES = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "accepted",
] as const;

export function StatusSelect({
  id,
  locale,
  current,
}: {
  id: string;
  locale: string;
  current: (typeof STATUSES)[number];
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as (typeof STATUSES)[number];
    startTransition(async () => {
      await updateApplicationStatus(id, next, locale);
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
