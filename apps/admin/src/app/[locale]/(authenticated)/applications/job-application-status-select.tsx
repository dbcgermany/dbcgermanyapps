"use client";

import { useTransition } from "react";
import {
  JOB_APPLICATION_STATUS_VALUES,
  type JobApplicationStatus,
} from "@dbc/types";
import { updateJobApplicationStatus } from "@/actions/job-applications";

const LABELS = {
  en: { new: "New", reviewing: "Reviewing", shortlisted: "Shortlisted", rejected: "Rejected", accepted: "Accepted" },
  de: { new: "Neu", reviewing: "In Prüfung", shortlisted: "Engere Auswahl", rejected: "Abgelehnt", accepted: "Angenommen" },
  fr: { new: "Nouvelle", reviewing: "En examen", shortlisted: "Présélectionnée", rejected: "Refusée", accepted: "Acceptée" },
} as const;

export function JobApplicationStatusSelect({
  id,
  locale,
  current,
}: {
  id: string;
  locale: string;
  current: string;
}) {
  const [isPending, startTransition] = useTransition();
  const labels = LABELS[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as JobApplicationStatus;
    startTransition(async () => {
      await updateJobApplicationStatus(id, next, undefined, locale);
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {JOB_APPLICATION_STATUS_VALUES.map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </select>
  );
}
