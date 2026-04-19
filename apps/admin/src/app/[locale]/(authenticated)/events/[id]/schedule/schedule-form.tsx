"use client";

import { useActionState } from "react";
import { createScheduleItem } from "@/actions/schedule";

const T = {
  en: {
    success: "Schedule item added.",
    titleEn: "Title (EN)",
    titleDe: "Title (DE)",
    titleFr: "Title (FR)",
    titlePh: "e.g., Opening Keynote",
    startTime: "Start time",
    endTime: "End time",
    sortOrder: "Sort order",
    speakerFirstName: "Speaker first name (optional)",
    speakerLastName: "Speaker last name (optional)",
    speakerTitle: "Speaker title (optional)",
    speakerTitlePh: "Founder & CEO, DBC",
    adding: "Adding…",
    add: "Add to Schedule",
  },
  de: {
    success: "Programmpunkt hinzugefügt.",
    titleEn: "Titel (EN)",
    titleDe: "Titel (DE)",
    titleFr: "Titel (FR)",
    titlePh: "z. B. Eröffnungs-Keynote",
    startTime: "Startzeit",
    endTime: "Endzeit",
    sortOrder: "Sortierung",
    speakerFirstName: "Vorname Sprecher:in (optional)",
    speakerLastName: "Nachname Sprecher:in (optional)",
    speakerTitle: "Titel Sprecher:in (optional)",
    speakerTitlePh: "Gründer & CEO, DBC",
    adding: "Wird hinzugefügt…",
    add: "Zum Programm hinzufügen",
  },
  fr: {
    success: "Élément ajouté au programme.",
    titleEn: "Titre (EN)",
    titleDe: "Titre (DE)",
    titleFr: "Titre (FR)",
    titlePh: "ex. Keynote d’ouverture",
    startTime: "Heure de début",
    endTime: "Heure de fin",
    sortOrder: "Ordre",
    speakerFirstName: "Prénom de l’intervenant (optionnel)",
    speakerLastName: "Nom de l’intervenant (optionnel)",
    speakerTitle: "Titre de l’intervenant (optionnel)",
    speakerTitlePh: "Fondateur & CEO, DBC",
    adding: "Ajout…",
    add: "Ajouter au programme",
  },
} as const;

export function ScheduleForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createScheduleItem(formData);
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
          {t.success}
        </div>
      )}

      {/* Title (trilingual) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="title_en" className="block text-xs text-muted-foreground mb-1">
            {t.titleEn}
          </label>
          <input
            id="title_en"
            name="title_en"
            type="text"
            required
            placeholder={t.titlePh}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="title_de" className="block text-xs text-muted-foreground mb-1">
            {t.titleDe}
          </label>
          <input
            id="title_de"
            name="title_de"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="title_fr" className="block text-xs text-muted-foreground mb-1">
            {t.titleFr}
          </label>
          <input
            id="title_fr"
            name="title_fr"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Time */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="starts_at" className="block text-xs text-muted-foreground mb-1">
            {t.startTime}
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="ends_at" className="block text-xs text-muted-foreground mb-1">
            {t.endTime}
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-xs text-muted-foreground mb-1">
            {t.sortOrder}
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

      {/* Speaker */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="speaker_first_name" className="block text-xs text-muted-foreground mb-1">
            {t.speakerFirstName}
          </label>
          <input
            id="speaker_first_name"
            name="speaker_first_name"
            type="text"
            placeholder="Jean-Clément"
            autoComplete="given-name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="speaker_last_name" className="block text-xs text-muted-foreground mb-1">
            {t.speakerLastName}
          </label>
          <input
            id="speaker_last_name"
            name="speaker_last_name"
            type="text"
            placeholder="Diambilay"
            autoComplete="family-name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div>
        <label htmlFor="speaker_title" className="block text-xs text-muted-foreground mb-1">
          {t.speakerTitle}
        </label>
        <input
          id="speaker_title"
          name="speaker_title"
          type="text"
          placeholder={t.speakerTitlePh}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.adding : t.add}
      </button>
    </form>
  );
}
