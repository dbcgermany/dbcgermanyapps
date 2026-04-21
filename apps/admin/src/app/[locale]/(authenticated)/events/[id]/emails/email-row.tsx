"use client";

import { useActionState, useState } from "react";
import { Badge, Button } from "@dbc/ui";
import {
  updateEmailSequence,
  deleteEmailSequence,
  dispatchEmailSequence,
} from "@/actions/email-sequences";

const ER_T = {
  en: {
    delayPh: "Delay (days after event)", sort: "Sort",
    subject: "Subject", body: "Body (use {name} and {event} tokens)",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    sent: "Sent",
    edit: "Edit", sendNow: "Send now",
    sendConfirm: "Send this sequence to all attendees now?",
    delete: "Delete", deleteConfirm: 'Delete sequence "{subject}"?',
  },
  de: {
    delayPh: "Verzögerung (Tage nach Event)", sort: "Sort.",
    subject: "Betreff", body: "Inhalt (Platzhalter {name} und {event})",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    sent: "Gesendet",
    edit: "Bearbeiten", sendNow: "Jetzt senden",
    sendConfirm: "Diese Sequenz jetzt an alle Teilnehmenden senden?",
    delete: "Löschen", deleteConfirm: "Sequenz „{subject}“ löschen?",
  },
  fr: {
    delayPh: "Délai (jours après l’événement)", sort: "Ordre",
    subject: "Objet", body: "Corps (utilisez {name} et {event})",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    sent: "Envoyé",
    edit: "Modifier", sendNow: "Envoyer maintenant",
    sendConfirm: "Envoyer cette séquence à tous les participants maintenant ?",
    delete: "Supprimer", deleteConfirm: "Supprimer la séquence « {subject} » ?",
  },
} as const;

type Sequence = {
  id: string;
  delay_days: number;
  subject_en: string;
  subject_de: string | null;
  subject_fr: string | null;
  body_en: string;
  body_de: string | null;
  body_fr: string | null;
  is_active: boolean;
  sort_order: number;
  sent_at: string | null;
};

export function EmailRow({
  seq,
  eventId,
  locale,
}: {
  seq: Sequence;
  eventId: string;
  locale: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const t = ER_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof ER_T];

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateEmailSequence(seq.id, formData);
      if (result.success) setMode("view");
      return result;
    },
    null
  );

  if (mode === "edit") {
    return (
      <form
        action={formAction}
        className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
      >
        {state?.error && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="delay_days"
            type="number"
            min="0"
            defaultValue={seq.delay_days}
            required
            placeholder={t.delayPh}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="sort_order"
            type="number"
            defaultValue={seq.sort_order}
            placeholder={t.sort}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t.subject}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              name="subject_en"
              defaultValue={seq.subject_en}
              required
              placeholder="EN"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              name="subject_de"
              defaultValue={seq.subject_de ?? ""}
              placeholder="DE"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              name="subject_fr"
              defaultValue={seq.subject_fr ?? ""}
              placeholder="FR"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t.body}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <textarea
              name="body_en"
              defaultValue={seq.body_en}
              rows={6}
              required
              placeholder="EN"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <textarea
              name="body_de"
              defaultValue={seq.body_de ?? ""}
              rows={6}
              placeholder="DE"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <textarea
              name="body_fr"
              defaultValue={seq.body_fr ?? ""}
              rows={6}
              placeholder="FR"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit"
            disabled={isPending}>
            {isPending ? t.saving : t.save}
          </Button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md border border-input px-4 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {t.cancel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent">+{seq.delay_days}d</Badge>
            <p className="font-medium">{seq.subject_en}</p>
            {seq.sent_at && (
              <Badge variant="success">
                {t.sent}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
            {seq.body_en}
          </p>
        </div>

        <div className="flex flex-col gap-1 shrink-0 items-end">
          {!seq.sent_at && (
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="text-xs text-primary hover:text-primary/80"
            >
              {t.edit}
            </button>
          )}
          {!seq.sent_at && (
            <form
              action={async () => {
                if (!confirm(t.sendConfirm)) return;
                await dispatchEmailSequence(seq.id, eventId, locale);
              }}
            >
              <button
                type="submit"
                className="text-xs text-primary hover:text-primary/80"
              >
                {t.sendNow}
              </button>
            </form>
          )}
          <form
            action={async () => {
              if (!confirm(t.deleteConfirm.replace("{subject}", seq.subject_en))) return;
              await deleteEmailSequence(seq.id, eventId, locale);
            }}
          >
            <button
              type="submit"
              className="text-xs text-red-500 hover:text-red-700"
            >
              {t.delete}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
