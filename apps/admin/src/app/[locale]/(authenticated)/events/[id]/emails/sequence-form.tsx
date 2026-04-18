"use client";

import { useActionState } from "react";
import { createEmailSequence } from "@/actions/email-sequences";

const T = {
  en: {
    added: "Sequence added.",
    delayDays: "Send N days after event ends", sortOrder: "Sort order",
    subject: "Subject", body: "Body", trilingual: "(trilingual)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    subjectPh: "Thank you for attending {event}",
    bodyPh: "Hi {name}, thank you for joining us…",
    adding: "Adding…", addSequence: "Add Sequence",
  },
  de: {
    added: "Sequenz hinzugefügt.",
    delayDays: "N Tage nach Veranstaltungsende senden", sortOrder: "Sortierung",
    subject: "Betreff", body: "Inhalt", trilingual: "(dreisprachig)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    subjectPh: "Danke für Ihre Teilnahme an {event}",
    bodyPh: "Hallo {name}, danke, dass Sie dabei waren…",
    adding: "Wird hinzugefügt…", addSequence: "Sequenz hinzufügen",
  },
  fr: {
    added: "Séquence ajoutée.",
    delayDays: "Envoyer N jours après la fin de l’événement", sortOrder: "Ordre",
    subject: "Objet", body: "Corps", trilingual: "(trilingue)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    subjectPh: "Merci d’avoir assisté à {event}",
    bodyPh: "Bonjour {name}, merci pour votre présence…",
    adding: "Ajout…", addSequence: "Ajouter la séquence",
  },
} as const;

export function SequenceForm({
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
      return createEmailSequence(formData);
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
          {t.added}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="delay_days" className="block text-xs text-muted-foreground mb-1">
            {t.delayDays}
          </label>
          <input
            id="delay_days"
            name="delay_days"
            type="number"
            min="0"
            defaultValue="1"
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

      {/* Subjects */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          {t.subject} <span className="text-muted-foreground">{t.trilingual}</span>
        </h3>
        {[
          { name: "subject_en", label: t.english, required: true },
          { name: "subject_de", label: t.deutsch },
          { name: "subject_fr", label: t.francais },
        ].map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="text"
              required={field.required}
              placeholder={t.subjectPh}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      {/* Bodies */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          {t.body} <span className="text-muted-foreground">{t.trilingual}</span>
        </h3>
        {[
          { name: "body_en", label: t.english, required: true },
          { name: "body_de", label: t.deutsch },
          { name: "body_fr", label: t.francais },
        ].map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={4}
              required={field.required}
              placeholder={t.bodyPh}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.adding : t.addSequence}
      </button>
    </form>
  );
}
