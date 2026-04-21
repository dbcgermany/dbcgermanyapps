"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button, Card } from "@dbc/ui";
import { updatePosterConfig, type PosterConfig } from "@/actions/poster";

const T = {
  en: {
    heading: "Customize poster text",
    subheading: "Override the default copy per language. Leave blank to use the default.",
    eyebrowLabel: "Small tag (above the title)",
    eyebrowHelp: "Short label shown above the event title. E.g. 'Tickets at the door'.",
    headlineLabel: "QR code headline",
    headlineHelp: "Prominent call-to-action above the QR code. E.g. 'Scan to buy your ticket'.",
    instructionsLabel: "QR instructions",
    instructionsHelp: "Small helper text under the QR code explaining how to scan.",
    saved: "Poster text saved. Refresh to see changes below.",
    saving: "Saving…", save: "Save poster text", reset: "Reset to defaults", close: "Close",
  },
  de: {
    heading: "Postertext anpassen",
    subheading: "Überschreiben Sie den Standardtext pro Sprache. Leer lassen, um den Standard zu verwenden.",
    eyebrowLabel: "Kleiner Tag (über dem Titel)",
    eyebrowHelp: "Kurzes Label über dem Veranstaltungstitel. Z. B. 'Tickets an der Abendkasse'.",
    headlineLabel: "QR-Code-Überschrift",
    headlineHelp: "Prominenter Call-to-Action über dem QR-Code. Z. B. 'Ticket scannen'.",
    instructionsLabel: "QR-Anweisungen",
    instructionsHelp: "Kurzer Hinweistext unter dem QR-Code, wie gescannt wird.",
    saved: "Postertext gespeichert. Aktualisieren Sie, um Änderungen unten zu sehen.",
    saving: "Wird gespeichert…", save: "Postertext speichern", reset: "Auf Standard zurücksetzen", close: "Schließen",
  },
  fr: {
    heading: "Personnaliser le texte de l’affiche",
    subheading: "Remplacez le texte par défaut par langue. Laissez vide pour utiliser la valeur par défaut.",
    eyebrowLabel: "Petit tag (au-dessus du titre)",
    eyebrowHelp: "Étiquette courte au-dessus du titre de l’événement. Ex. 'Billets sur place'.",
    headlineLabel: "Titre du QR code",
    headlineHelp: "Appel à l’action au-dessus du QR code. Ex. 'Scannez pour acheter votre billet'.",
    instructionsLabel: "Instructions QR",
    instructionsHelp: "Court texte sous le QR code expliquant comment scanner.",
    saved: "Texte de l’affiche enregistré. Actualisez pour voir les modifications.",
    saving: "Enregistrement…", save: "Enregistrer le texte", reset: "Réinitialiser aux valeurs par défaut", close: "Fermer",
  },
} as const;

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
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const fields = [
    { key: "eyebrow" as const, label: t.eyebrowLabel, help: t.eyebrowHelp, multiline: false },
    { key: "headline" as const, label: t.headlineLabel, help: t.headlineHelp, multiline: false },
    { key: "instructions" as const, label: t.instructionsLabel, help: t.instructionsHelp, multiline: true },
  ];

  function handleChange(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePosterConfig(eventId, draft, locale);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.saved);
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
              {t.heading}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.subheading}
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
            {fields.map((field) => (
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
            <Button type="button"
              onClick={handleSave}
              disabled={isPending}>
              {isPending ? t.saving : t.save}
            </Button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t.reset}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              {t.close}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
