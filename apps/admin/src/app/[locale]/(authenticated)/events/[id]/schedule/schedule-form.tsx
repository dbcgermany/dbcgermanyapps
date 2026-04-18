"use client";

import { useActionState } from "react";
import { createScheduleItem } from "@/actions/schedule";

export function ScheduleForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createScheduleItem(formData);
    },
    null
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Schedule item added.
        </div>
      )}

      {/* Title (trilingual) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="title_en" className="block text-xs text-muted-foreground mb-1">
            Title (EN)
          </label>
          <input
            id="title_en"
            name="title_en"
            type="text"
            required
            placeholder="e.g., Opening Keynote"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="title_de" className="block text-xs text-muted-foreground mb-1">
            Title (DE)
          </label>
          <input
            id="title_de"
            name="title_de"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="title_fr" className="block text-xs text-muted-foreground mb-1">
            Title (FR)
          </label>
          <input
            id="title_fr"
            name="title_fr"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Time */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="starts_at" className="block text-xs text-muted-foreground mb-1">
            Start time
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="ends_at" className="block text-xs text-muted-foreground mb-1">
            End time
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-xs text-muted-foreground mb-1">
            Sort order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue="0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Speaker */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="speaker_name" className="block text-xs text-muted-foreground mb-1">
            Speaker name (optional)
          </label>
          <input
            id="speaker_name"
            name="speaker_name"
            type="text"
            placeholder="Dr. Jean-Clément Diambilay"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="speaker_title" className="block text-xs text-muted-foreground mb-1">
            Speaker title (optional)
          </label>
          <input
            id="speaker_title"
            name="speaker_title"
            type="text"
            placeholder="Founder & CEO, DBC"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add to Schedule"}
      </button>
    </form>
  );
}
