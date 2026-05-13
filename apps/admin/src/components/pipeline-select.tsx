"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PIPELINE_STATUS_VALUES, type PipelineStatus } from "@dbc/types";
import { upsertContactUserState } from "@/actions/contacts";
import { PipelineBadge } from "./pipeline-badge";

/**
 * Inline pipeline picker on a contact profile. Saves on change.
 * Scoped per-user via RLS (only the current operator sees / edits).
 */
export function PipelineSelect({
  contactId,
  initialStatus,
}: {
  contactId: string;
  initialStatus: PipelineStatus | null;
}) {
  const t = useTranslations("admin.contacts.pipeline");
  const [status, setStatus] = useState<PipelineStatus | null>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const apply = (next: PipelineStatus | null) => {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await upsertContactUserState({
        contactId,
        pipelineStatus: next,
      });
      if ("error" in result) {
        toast.error(result.error);
        setStatus(previous);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3">
      <PipelineBadge status={status} />
      <select
        value={status ?? ""}
        onChange={(e) =>
          apply((e.target.value || null) as PipelineStatus | null)
        }
        disabled={isPending}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
      >
        <option value="">{t("placeholder")}</option>
        {PIPELINE_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
