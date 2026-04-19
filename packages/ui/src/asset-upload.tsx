"use client";

import * as React from "react";
import { cn } from "./utils";

export interface AssetUploadProps {
  /** Current URL to preview. Null/empty = no current image. */
  value: string | null;
  /**
   * Called with the selected file. Consumer uploads it (e.g. via a server
   * action) and resolves to the resulting public URL. Reject to surface the
   * error to the user.
   */
  onUpload: (file: File) => Promise<string>;
  /** Called when the consumer's upload returns the new URL (optional). */
  onChange?: (url: string) => void;
  /** Called when the user clicks "Remove" (optional). */
  onRemove?: () => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  accept?: string;
  disabled?: boolean;
  className?: string;
  /** Max bytes; default 5 MB. */
  maxSize?: number;
}

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/svg+xml";
// Generous client-side cap so users can drop in raw phone photos or
// retina screenshots. The server action (toWebp) compresses every
// raster input before storage, so the stored file is well under 500 KB
// regardless of source size.
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

/**
 * Drag-drop + click-to-browse uploader with live preview. The consumer owns
 * the actual upload (pass onUpload) so @dbc/ui stays framework-agnostic.
 */
export function AssetUpload({
  value,
  onUpload,
  onChange,
  onRemove,
  label,
  description,
  accept = DEFAULT_ACCEPT,
  disabled,
  className,
  maxSize = DEFAULT_MAX_SIZE,
}: AssetUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState<
    | { kind: "idle" }
    | { kind: "uploading"; fileName: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [isDragging, setIsDragging] = React.useState(false);

  async function handleFile(file: File) {
    if (disabled) return;
    if (file.size > maxSize) {
      setState({
        kind: "error",
        message: `File is too large (max ${Math.round(maxSize / 1024 / 1024)} MB).`,
      });
      return;
    }
    setState({ kind: "uploading", fileName: file.name });
    try {
      const url = await onUpload(file);
      onChange?.(url);
      setState({ kind: "idle" });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors",
          disabled
            ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
            : "cursor-pointer hover:border-primary/40",
          isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-24 w-24 rounded-md object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}

        <div className="text-center">
          {state.kind === "uploading" ? (
            <p className="text-xs text-muted-foreground">
              Uploading {state.fileName}…
            </p>
          ) : (
            <>
              <p className="text-xs font-medium">
                {value ? "Replace image" : "Click or drop an image"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                PNG/JPG/WebP/AVIF · up to {Math.round(maxSize / 1024 / 1024)} MB
              </p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {state.kind === "error" && (
        <p className="text-xs text-red-600" role="alert">
          {state.message}
        </p>
      )}

      {value && onRemove && state.kind !== "uploading" && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="self-start text-xs font-medium text-red-600 hover:opacity-80 disabled:opacity-50"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
