"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input } from "@dbc/ui";
import { createScheduleItem } from "@/actions/schedule";

const T = {
  en: {
    success: "Schedule item added",
    titleLabel: "Title *",
    titleHint: "Required. Shown on the public event page schedule.",
    translationsTitle: "Other languages (optional)",
    titleEn: "English",
    titleDe: "German",
    titleFr: "French",
    titlePh: "e.g. Opening Keynote",
    startTime: "Start time *",
    endTime: "End time *",
    sortOrder: "Sort order",
    speakerFirstName: "Speaker first name (optional)",
    speakerLastName: "Speaker last name (optional)",
    speakerTitle: "Speaker title (optional)",
    speakerTitlePh: "Founder & CEO, DBC",
    adding: "Adding…",
    add: "Add to schedule",
  },
  de: {
    success: "Programmpunkt hinzugefügt",
    titleLabel: "Titel *",
    titleHint: "Erforderlich. Auf der öffentlichen Event-Seite im Programm sichtbar.",
    translationsTitle: "Andere Sprachen (optional)",
    titleEn: "Englisch",
    titleDe: "Deutsch",
    titleFr: "Französisch",
    titlePh: "z. B. Eröffnungs-Keynote",
    startTime: "Startzeit *",
    endTime: "Endzeit *",
    sortOrder: "Sortierung",
    speakerFirstName: "Vorname Speaker (optional)",
    speakerLastName: "Nachname Speaker (optional)",
    speakerTitle: "Titel Speaker (optional)",
    speakerTitlePh: "Gründer & CEO, DBC",
    adding: "Wird hinzugefügt…",
    add: "Zum Programm hinzufügen",
  },
  fr: {
    success: "Élément ajouté au programme",
    titleLabel: "Titre *",
    titleHint: "Obligatoire. Affiché dans le programme sur la page publique.",
    translationsTitle: "Autres langues (facultatif)",
    titleEn: "Anglais",
    titleDe: "Allemand",
    titleFr: "Français",
    titlePh: "ex. Keynote d’ouverture",
    startTime: "Heure de début *",
    endTime: "Heure de fin *",
    sortOrder: "Ordre",
    speakerFirstName: "Prénom de l’intervenant (optionnel)",
    speakerLastName: "Nom de l’intervenant (optionnel)",
    speakerTitle: "Titre de l’intervenant (optionnel)",
    speakerTitlePh: "Fondateur & CEO, DBC",
    adding: "Ajout…",
    add: "Ajouter au programme",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function ScheduleForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createScheduleItem(formData);
    },
    null
  );

  const lastHandledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
      return;
    }
    if (state?.success) {
      toast.success(t.success);
      router.refresh();
    }
  }, [state, router, t.success]);

  // Active-locale title is primary required; other two locales go into the
  // optional translations panel at the bottom (same pattern as expense + tier).
  const primaryTitle =
    locale === "fr"
      ? { name: "title_fr", label: t.titleLabel }
      : locale === "de"
        ? { name: "title_de", label: t.titleLabel }
        : { name: "title_en", label: t.titleLabel };
  const secondaryTitles =
    locale === "fr"
      ? ([
          { name: "title_en", label: t.titleEn },
          { name: "title_de", label: t.titleDe },
        ] as const)
      : locale === "de"
        ? ([
            { name: "title_en", label: t.titleEn },
            { name: "title_fr", label: t.titleFr },
          ] as const)
        : ([
            { name: "title_de", label: t.titleDe },
            { name: "title_fr", label: t.titleFr },
          ] as const);

  return (
    <form action={formAction} className="mt-4 space-y-6">
      <FormField label={primaryTitle.label} required hint={t.titleHint}>
        <Input name={primaryTitle.name} required placeholder={t.titlePh} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.startTime} required>
          <Input name="starts_at" type="datetime-local" required />
        </FormField>
        <FormField label={t.endTime} required>
          <Input name="ends_at" type="datetime-local" required />
        </FormField>
        <FormField label={t.sortOrder}>
          <Input name="sort_order" type="number" defaultValue="0" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.speakerFirstName}>
          <Input
            name="speaker_first_name"
            placeholder="Jean-Clément"
            autoComplete="given-name"
          />
        </FormField>
        <FormField label={t.speakerLastName}>
          <Input
            name="speaker_last_name"
            placeholder="Diambilay"
            autoComplete="family-name"
          />
        </FormField>
      </div>

      <FormField label={t.speakerTitle}>
        <Input name="speaker_title" placeholder={t.speakerTitlePh} />
      </FormField>

      <details className="rounded-md border border-border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t.translationsTitle}
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {secondaryTitles.map((f) => (
            <FormField key={f.name} label={f.label}>
              <Input name={f.name} />
            </FormField>
          ))}
        </div>
      </details>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.adding : t.add}
      </Button>
    </form>
  );
}
