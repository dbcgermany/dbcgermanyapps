"use client";

import { useRef, useState, useTransition } from "react";
import { uploadEventCover } from "@/actions/events";

export function CoverImageUpload({
  initialUrl = null,
  name = "cover_image_url",
}: {
  initialUrl?: string | null;
  name?: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const result = await uploadEventCover(fd);
      if (result.success) {
        setUrl(result.url);
      } else {
        setError(result.error ?? "Upload failed");
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        Cover image
      </label>

      {/* The value that gets submitted with the parent form. */}
      <input
        id={name}
        name={name}
        type="url"
        value={url ?? ""}
        onChange={(e) => setUrl(e.target.value || null)}
        placeholder="https://… or upload below"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={isUploading}
          className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
        />
        {isUploading && (
          <span className="text-xs text-muted-foreground">Uploading…</span>
        )}
        {url && !isUploading && (
          <button
            type="button"
            onClick={() => setUrl(null)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Cover preview"
          className="h-36 w-auto rounded-md border border-border object-cover"
        />
      )}

      <p className="text-xs text-muted-foreground">
        JPG / PNG / WebP, up to 8 MB. Stored in the <code>event-covers</code>{" "}
        Supabase bucket.
      </p>
    </div>
  );
}
