"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { createEmailSequence } from "@/actions/email-sequences";

const T = {
  en: {
    added: "Sequence added",
    delayDays: "Send N days after event ends *",
    delayHint: "0 = same day as event end. Positive = days after.",
    sortOrder: "Sort order",
    subjectLabel: "Subject *",
    subjectHint:
      "Required. Tokens: {event}, {name}. The active language is shown first; other languages are optional and live in the panel below.",
    bodyLabel: "Body *",
    bodyHint:
      "Required. Tokens: {event}, {name}. The active language is shown first.",
    translationsTitle: "Other languages (optional)",
    english: "English",
    deutsch: "Deutsch",
    francais: "Français",
    subjectPh: "Thank you for attending {event}",
    bodyPh: "Hi {name}, thank you for joining us…",
    adding: "Adding…",
    addSequence: "Add sequence",
  },
  de: {
    added: "Sequenz hinzugefügt",
    delayDays: "N Tage nach Veranstaltungsende senden *",
    delayHint: "0 = am Tag des Eventendes. Positive Zahl = Tage danach.",
    sortOrder: "Sortierung",
    subjectLabel: "Betreff *",
    subjectHint:
      "Erforderlich. Platzhalter: {event}, {name}. Die aktive Sprache wird zuerst gezeigt; andere Sprachen sind optional und liegen im Panel unten.",
    bodyLabel: "Inhalt *",
    bodyHint:
      "Erforderlich. Platzhalter: {event}, {name}. Die aktive Sprache wird zuerst gezeigt.",
    translationsTitle: "Andere Sprachen (optional)",
    english: "Englisch",
    deutsch: "Deutsch",
    francais: "Französisch",
    subjectPh: "Danke für Ihre Teilnahme an {event}",
    bodyPh: "Hallo {name}, danke, dass Sie dabei waren…",
    adding: "Wird hinzugefügt…",
    addSequence: "Sequenz hinzufügen",
  },
  fr: {
    added: "Séquence ajoutée",
    delayDays: "Envoyer N jours après la fin de l’événement *",
    delayHint: "0 = le jour même de la fin. Positif = jours après.",
    sortOrder: "Ordre",
    subjectLabel: "Objet *",
    subjectHint:
      "Obligatoire. Variables : {event}, {name}. La langue active est affichée en premier ; les autres langues sont facultatives dans le panneau ci-dessous.",
    bodyLabel: "Corps *",
    bodyHint:
      "Obligatoire. Variables : {event}, {name}. La langue active est affichée en premier.",
    translationsTitle: "Autres langues (facultatif)",
    english: "Anglais",
    deutsch: "Allemand",
    francais: "Français",
    subjectPh: "Merci d’avoir assisté à {event}",
    bodyPh: "Bonjour {name}, merci pour votre présence…",
    adding: "Ajout…",
    addSequence: "Ajouter la séquence",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function SequenceForm({
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
      return createEmailSequence(formData);
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
      toast.success(t.added);
      router.refresh();
    }
  }, [state, router, t.added]);

  // Active-locale subject/body are primary required; other two locales sit
  // in the optional translations panel.
  const primarySubject =
    locale === "fr"
      ? "subject_fr"
      : locale === "de"
        ? "subject_de"
        : "subject_en";
  const primaryBody =
    locale === "fr" ? "body_fr" : locale === "de" ? "body_de" : "body_en";

  const secondaryFields =
    locale === "fr"
      ? ([
          { subject: "subject_en", body: "body_en", label: t.english },
          { subject: "subject_de", body: "body_de", label: t.deutsch },
        ] as const)
      : locale === "de"
        ? ([
            { subject: "subject_en", body: "body_en", label: t.english },
            { subject: "subject_fr", body: "body_fr", label: t.francais },
          ] as const)
        : ([
            { subject: "subject_de", body: "body_de", label: t.deutsch },
            { subject: "subject_fr", body: "body_fr", label: t.francais },
          ] as const);

  return (
    <form action={formAction} className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.delayDays} required hint={t.delayHint}>
          <Input
            name="delay_days"
            type="number"
            min="0"
            defaultValue="1"
            required
          />
        </FormField>
        <FormField label={t.sortOrder}>
          <Input name="sort_order" type="number" defaultValue="0" />
        </FormField>
      </div>

      <FormField label={t.subjectLabel} required hint={t.subjectHint}>
        <Input name={primarySubject} required placeholder={t.subjectPh} />
      </FormField>

      <FormField label={t.bodyLabel} required hint={t.bodyHint}>
        <Textarea name={primaryBody} rows={6} required placeholder={t.bodyPh} />
      </FormField>

      <details className="rounded-md border border-border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t.translationsTitle}
        </summary>
        <div className="mt-3 space-y-4">
          {secondaryFields.map((f) => (
            <div key={f.subject} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {f.label}
              </p>
              <FormField label="Subject">
                <Input name={f.subject} placeholder={t.subjectPh} />
              </FormField>
              <FormField label="Body">
                <Textarea name={f.body} rows={4} placeholder={t.bodyPh} />
              </FormField>
            </div>
          ))}
        </div>
      </details>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.adding : t.addSequence}
      </Button>
    </form>
  );
}
