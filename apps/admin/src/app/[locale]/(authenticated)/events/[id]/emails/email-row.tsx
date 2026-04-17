"use client";

import { useActionState, useState } from "react";
import { Badge } from "@dbc/ui";
import {
  updateEmailSequence,
  deleteEmailSequence,
  dispatchEmailSequence,
} from "@/actions/email-sequences";

type Sequence = {
  id: string;
  delay_days: number;
  subject_en: string;
  subject_de: string | null;
  subject_fr: string | null;
  body_en: string;
  body_de: string | null;
  body_fr: string | null;
  is_active: boolean;
  sort_order: number;
  sent_at: string | null;
};

export function EmailRow({
  seq,
  eventId,
  locale,
}: {
  seq: Sequence;
  eventId: string;
  locale: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateEmailSequence(seq.id, formData);
      if (result.success) setMode("view");
      return result;
    },
    null
  );

  if (mode === "edit") {
    return (
      <form
        action={formAction}
        className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
      >
        {state?.error && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="delay_days"
            type="number"
            min="0"
            defaultValue={seq.delay_days}
            required
            placeholder="Delay (days after event)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="sort_order"
            type="number"
            defaultValue={seq.sort_order}
            placeholder="Sort"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Subject</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              name="subject_en"
              defaultValue={seq.subject_en}
              required
              placeholder="EN"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              name="subject_de"
              defaultValue={seq.subject_de ?? ""}
              placeholder="DE"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              name="subject_fr"
              defaultValue={seq.subject_fr ?? ""}
              placeholder="FR"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Body (use {"{name}"} and {"{event}"} tokens)
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <textarea
              name="body_en"
              defaultValue={seq.body_en}
              rows={6}
              required
              placeholder="EN"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <textarea
              name="body_de"
              defaultValue={seq.body_de ?? ""}
              rows={6}
              placeholder="DE"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <textarea
              name="body_fr"
              defaultValue={seq.body_fr ?? ""}
              rows={6}
              placeholder="FR"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md border border-input px-4 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              +{seq.delay_days}d
            </span>
            <p className="font-medium">{seq.subject_en}</p>
            {seq.sent_at && (
              <Badge variant="success">
                Sent
              </Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
            {seq.body_en}
          </p>
        </div>

        <div className="flex flex-col gap-1 shrink-0 items-end">
          {!seq.sent_at && (
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="text-xs text-primary hover:text-primary/80"
            >
              Edit
            </button>
          )}
          {!seq.sent_at && (
            <form
              action={async () => {
                if (!confirm("Send this sequence to all attendees now?"))
                  return;
                await dispatchEmailSequence(seq.id, eventId, locale);
              }}
            >
              <button
                type="submit"
                className="text-xs text-primary hover:text-primary/80"
              >
                Send now
              </button>
            </form>
          )}
          <form
            action={async () => {
              if (!confirm(`Delete sequence "${seq.subject_en}"?`)) return;
              await deleteEmailSequence(seq.id, eventId, locale);
            }}
          >
            <button
              type="submit"
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
