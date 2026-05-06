"use client";

import { useState } from "react";
import { Card } from "@dbc/ui";
import { Copy, Download, ExternalLink } from "lucide-react";

/**
 * Per-event QR card for the admin detail page. The PNG is generated server-side
 * (see EventDetailPage) and passed in as a data URL so the visual is ready on
 * first paint and downloads happen instantly without a round-trip.
 */
export function EventQrCard({
  pngDataUrl,
  publicUrl,
  fileBaseName,
  labels,
}: {
  pngDataUrl: string;
  publicUrl: string;
  fileBaseName: string;
  labels: {
    title: string;
    description: string;
    publicLink: string;
    download: string;
    copy: string;
    copied: string;
    open: string;
  };
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <Card padding="md" className="rounded-lg">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* QR — square, fixed size; image rendering crisp on retina because
            the source PNG is generated at 720px in the parent server component */}
        <div className="flex shrink-0 items-center justify-center rounded-md border border-border bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pngDataUrl}
            alt={labels.title}
            width={180}
            height={180}
            className="h-[180px] w-[180px] rounded-sm"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <p className="font-heading text-base font-semibold">
              {labels.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {labels.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {labels.publicLink}
            </p>
            <p className="mt-1 break-all rounded-md bg-muted/50 px-2.5 py-1.5 font-mono text-xs">
              {publicUrl}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={pngDataUrl}
              download={`${fileBaseName}.png`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" strokeWidth={1.75} />
              {labels.download}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Copy className="h-4 w-4" strokeWidth={1.75} />
              {copied ? labels.copied : labels.copy}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              {labels.open}
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
