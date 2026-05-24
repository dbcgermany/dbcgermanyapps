"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge, Button, ConfirmDialog } from "@dbc/ui";
import {
  updateEmailSequence,
  deleteEmailSequence,
  dispatchEmailSequence,
} from "@/actions/email-sequences";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

const ER_T = {
  en: {
    delayPh: "Delay (days after event)", sort: "Sort",
    subject: "Subject", body: "Body (use {name} and {event} tokens)",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    sent: "Sent",
    sendNow: "Send now",
    sendConfirm: "Send this sequence to all attendees now?",
    delete: "Delete", deleteConfirm: 'Delete sequence "{subject}"?',
    deletedToast: "Sequence deleted",
  },
  de: {
    delayPh: "Verzögerung (Tage nach Event)", sort: "Sort.",
    subject: "Betreff", body: "Inhalt (Platzhalter {name} und {event})",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    sent: "Gesendet",
    sendNow: "Jetzt senden",
    sendConfirm: "Diese Sequenz jetzt an alle Teilnehmenden senden?",
    delete: "Löschen", deleteConfirm: "Sequenz „{subject}“ löschen?",
    deletedToast: "Sequenz gelöscht",
  },
  fr: {
    delayPh: "Délai (jours après l’événement)", sort: "Ordre",
    subject: "Objet", body: "Corps (utilisez {name} et {event})",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    sent: "Envoyé",
    sendNow: "Envoyer maintenant",
    sendConfirm: "Envoyer cette séquence à tous les participants maintenant ?",
    delete: "Supprimer", deleteConfirm: "Supprimer la séquence « {subject} » ?",
    deletedToast: "Séquence supprimée",
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
  const t = ER_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof ER_T];
  const router = useRouter();
  const tCommon = useTranslations("admin.common");
  const alreadySent = Boolean(seq.sent_at);

  return (
    <InlineEditRow
      title={seq.subject_en}
      badges={
        <>
          <Badge variant="accent">+{seq.delay_days}d</Badge>
          {alreadySent && <Badge variant="success">{t.sent}</Badge>}
        </>
      }
      meta={
        <span className="line-clamp-3 whitespace-pre-wrap">{seq.body_en}</span>
      }
      actions={
        !alreadySent && (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm">
                {t.sendNow}
              </Button>
            }
            title={t.sendConfirm}
            description={seq.subject_en}
            confirmLabel={t.sendNow}
            cancelLabel={t.cancel}
            variant="neutral"
            onConfirm={async () => {
              const res = await dispatchEmailSequence(seq.id, eventId, locale);
              if (res?.error) {
                toast.error(
                  tCommon("actionFailedToast", { error: res.error })
                );
                return;
              }
              toast.success(tCommon("sentToast"));
              router.refresh();
            }}
          />
        )
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteEmailSequence(seq.id, eventId, locale)}
          confirmTitle={t.deleteConfirm.replace("{subject}", seq.subject_en)}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deletedToast}
          compact
        />
      }
      renderEdit={
        alreadySent
          ? undefined
          : ({ close }) => (
              <EmailEditForm
                seq={seq}
                eventId={eventId}
                locale={locale}
                t={t}
                onSaved={close}
              />
            )
      }
    />
  );
}

/* -------------------------------------------------------------------------- */

type EmailT = (typeof ER_T)[keyof typeof ER_T];

function EmailEditForm({
  seq,
  eventId,
  locale,
  t,
  onSaved,
}: {
  seq: Sequence;
  eventId: string;
  locale: string;
  t: EmailT;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateEmailSequence(seq.id, formData);
      if (result.success) onSaved();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="rounded-md bg-danger-soft p-2 text-xs text-danger">
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
        <p className="text-xs font-medium text-muted-foreground">{t.body}</p>
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
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onSaved}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
