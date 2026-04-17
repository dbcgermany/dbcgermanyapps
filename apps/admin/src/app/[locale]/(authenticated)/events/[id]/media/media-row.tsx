"use client";

import { useActionState, useState } from "react";
import { Camera, Film, Link2, type LucideIcon } from "lucide-react";
import { updateEventMedia, deleteEventMedia } from "@/actions/media";

type Media = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  sort_order: number;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  photo: Camera,
  video: Film,
  link: Link2,
};

export function MediaRow({
  item,
  eventId,
  locale,
}: {
  item: Media;
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
      const result = await updateEventMedia(item.id, formData);
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
        <input
          name="title"
          defaultValue={item.title ?? ""}
          placeholder="Title / caption"
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="url"
          type="url"
          defaultValue={item.url}
          placeholder="URL"
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="sort_order"
          type="number"
          defaultValue={item.sort_order}
          placeholder="Sort order"
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
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
    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
      {(() => { const Icon = TYPE_ICONS[item.type] ?? Camera; return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />; })()}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title || item.type}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-primary"
        >
          {item.url}
        </a>
      </div>
      <div className="flex flex-col gap-1 shrink-0 items-end">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          Edit
        </button>
        <form
          action={async () => {
            if (!confirm("Delete this media item?")) return;
            await deleteEventMedia(item.id, eventId, locale);
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
  );
}
