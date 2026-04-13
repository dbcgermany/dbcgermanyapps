"use client";

import { useActionState } from "react";
import { addEventMedia } from "@/actions/media";

export function MediaForm({
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
      return addEventMedia(formData);
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
          Media added.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="type" className="block text-xs text-muted-foreground mb-1">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-xs text-muted-foreground mb-1">
            Title (optional)
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g., Keynote photos"
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

      <div>
        <label htmlFor="url" className="block text-xs text-muted-foreground mb-1">
          URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Paste a URL from Supabase Storage, Google Drive, YouTube, Vimeo, or any
          public link.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add Media"}
      </button>
    </form>
  );
}
