"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  INCUBATION_APPLICATION_STATUS_VALUES,
  type IncubationApplicationStatus,
} from "@dbc/types";
import { updateApplicationStatus } from "@/actions/applications";

const LABELS = {
  en: {
    new: "New", reviewing: "Reviewing", shortlisted: "Shortlisted",
    rejected: "Rejected", accepted: "Accepted",
  },
  de: {
    new: "Neu", reviewing: "In Prüfung", shortlisted: "Engere Auswahl",
    rejected: "Abgelehnt", accepted: "Angenommen",
  },
  fr: {
    new: "Nouvelle", reviewing: "En examen", shortlisted: "Présélectionnée",
    rejected: "Refusée", accepted: "Acceptée",
  },
} as const;

export function StatusSelect({
  id,
  locale,
  current,
}: {
  id: string;
  locale: string;
  current: IncubationApplicationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tCommon = useTranslations("admin.common");
  const labels = LABELS[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as IncubationApplicationStatus;
    startTransition(async () => {
      const res = await updateApplicationStatus(id, next, locale);
      if (res?.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
        // Pull server truth back into the select.
        router.refresh();
        return;
      }
      toast.success(tCommon("savedToast"));
      router.refresh();
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {INCUBATION_APPLICATION_STATUS_VALUES.map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </select>
  );
}
