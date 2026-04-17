"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@dbc/ui";
import { updatePosterConfig, type PosterConfig } from "@/actions/poster";

const FIELDS = ["eyebrow", "headline", "instructions"] as const;
const LOCALES = ["en", "de", "fr"] as const;

interface Defaults {
  en: Record<string, string>;
  de: Record<string, string>;
  fr: Record<string, string>;
}

export function PosterConfigEditor({
  eventId,
  locale,
  initial,
  defaults,
}: {
  eventId: string;
  locale: string;
  initial: PosterConfig;
  defaults: Defaults;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PosterConfig>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePosterConfig(eventId, draft, locale);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Poster text saved. Refresh to see changes on the poster below.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-primary hover:underline"
      >
        Edit poster text &rarr;
      </button>
    );
  }

  return (
    <Card padding="md" className="rounded-lg">
      <h2 className="font-heading text-base font-semibold">
        Customize poster text
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Override the default poster copy per locale. Leave blank to use the
        default.
      </p>

      <div className="mt-4 space-y-4">
        {FIELDS.map((field) => (
          <div key={field}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {field}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {LOCALES.map((loc) => {
                const dbKey = `${field}_${loc}` as keyof PosterConfig;
                const placeholder =
                  defaults[loc]?.[field] ?? "";
                return (
                  <div key={loc}>
                    <label className="mb-1 block text-[11px] font-medium uppercase text-muted-foreground">
                      {loc.toUpperCase()}
                    </label>
                    {field === "instructions" ? (
                      <textarea
                        value={(draft[dbKey] as string) ?? ""}
                        onChange={(e) => handleChange(dbKey, e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={(draft[dbKey] as string) ?? ""}
                        onChange={(e) => handleChange(dbKey, e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Saving\u2026" : "Save poster text"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
        >
          Close
        </button>
      </div>
    </Card>
  );
}
