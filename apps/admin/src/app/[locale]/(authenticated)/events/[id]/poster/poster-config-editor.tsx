"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Card } from "@dbc/ui";
import { updatePosterConfig, type PosterConfig } from "@/actions/poster";

const FIELDS: Array<{
  key: "eyebrow" | "headline" | "instructions";
  label: string;
  help: string;
  multiline?: boolean;
}> = [
  {
    key: "eyebrow",
    label: "Small tag (above the title)",
    help: "Short label shown above the event title. E.g. 'Tickets at the door'.",
  },
  {
    key: "headline",
    label: "QR code headline",
    help: "Prominent call-to-action above the QR code. E.g. 'Scan to buy your ticket'.",
  },
  {
    key: "instructions",
    label: "QR instructions",
    help: "Small helper text under the QR code explaining how to scan.",
    multiline: true,
  },
];

const LOCALES = [
  { code: "en" as const, label: "English", flag: "EN" },
  { code: "de" as const, label: "Deutsch", flag: "DE" },
  { code: "fr" as const, label: "Français", flag: "FR" },
];

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
        toast.success("Poster text saved. Refresh to see changes below.");
      }
    });
  }

  function handleReset() {
    setDraft({} as PosterConfig);
  }

  return (
    <Card padding="md" className="rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">
              Customize poster text
            </h2>
            <p className="text-xs text-muted-foreground">
              Override the default copy per language. Leave blank to use the default.
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <>
          <div className="mt-6 space-y-6">
            {FIELDS.map((field) => (
              <div key={field.key} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-1">
                  <p className="text-sm font-semibold">{field.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {field.help}
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {LOCALES.map((loc) => {
                    const dbKey = `${field.key}_${loc.code}` as keyof PosterConfig;
                    const placeholder = defaults[loc.code]?.[field.key] ?? "";
                    return (
                      <div key={loc.code}>
                        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                            {loc.flag}
                          </span>
                          <span className="font-sans font-medium normal-case text-muted-foreground">
                            {loc.label}
                          </span>
                        </label>
                        {field.multiline ? (
                          <textarea
                            value={(draft[dbKey] as string) ?? ""}
                            onChange={(e) => handleChange(dbKey, e.target.value)}
                            placeholder={placeholder}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <input
                            type="text"
                            value={(draft[dbKey] as string) ?? ""}
                            onChange={(e) => handleChange(dbKey, e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save poster text"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              Close
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
