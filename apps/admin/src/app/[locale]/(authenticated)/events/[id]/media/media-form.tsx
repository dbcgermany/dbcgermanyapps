"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { AssetUpload } from "@dbc/ui";
import { addEventMedia, uploadEventMediaFile } from "@/actions/media";

export function MediaForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"photo" | "video" | "link">("photo");
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      formData.set("url", url);
      formData.set("type", type);
      const result = await addEventMedia(formData);
      if ("success" in result && result.success) {
        setUrl("");
      }
      return result;
    },
    null
  );

  async function handleUpload(file: File): Promise<string> {
    const result = await uploadEventMediaFile(eventId, file);
    if ("error" in result && result.error) {
      throw new Error(result.error);
    }
    if ("url" in result && result.url) {
      setUrl(result.url);
      toast.success("File uploaded — click Add Media to save.");
      return result.url;
    }
    throw new Error("Upload returned no URL.");
  }

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
          <label className="block text-xs text-muted-foreground mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            Title (optional)
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g., Keynote photos"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Sort order
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue="0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {type !== "link" && (
        <AssetUpload
          label="Upload a file (optional)"
          description="Upload to Supabase Storage. Or skip and paste any public URL below."
          accept={
            type === "video"
              ? "video/mp4,video/webm,video/quicktime"
              : "image/png,image/jpeg,image/webp,image/avif"
          }
          value={url || null}
          onUpload={handleUpload}
          onChange={setUrl}
          onRemove={() => setUrl("")}
        />
      )}

      <div>
        <label className="block text-xs text-muted-foreground mb-1">URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          required
          placeholder="https://…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Paste a URL from Supabase Storage, Google Drive, YouTube, Vimeo, or any
          public link.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || !url}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add Media"}
      </button>
    </form>
  );
}
