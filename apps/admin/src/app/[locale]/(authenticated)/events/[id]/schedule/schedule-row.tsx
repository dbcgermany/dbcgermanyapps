"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import {
  updateScheduleItem,
  deleteScheduleItem,
} from "@/actions/schedule";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

const SR_T = {
  en: {
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    speakerName: "Speaker name", speakerTitle: "Speaker title", sort: "Sort",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    savedToast: "Saved",
    delete: "Delete", deleteConfirm: 'Delete "{title}"?',
    deletedToast: "Item deleted",
  },
  de: {
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    speakerName: "Name Speaker", speakerTitle: "Titel Speaker", sort: "Sort.",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    savedToast: "Gespeichert",
    delete: "Löschen", deleteConfirm: "„{title}“ löschen?",
    deletedToast: "Eintrag gelöscht",
  },
  fr: {
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    speakerName: "Nom de l’intervenant", speakerTitle: "Titre de l’intervenant", sort: "Ordre",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    savedToast: "Enregistré",
    delete: "Supprimer", deleteConfirm: "Supprimer « {title} » ?",
    deletedToast: "Élément supprimé",
  },
} as const;

type Item = {
  id: string;
  title_en: string;
  title_de: string | null;
  title_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  starts_at: string;
  ends_at: string;
  speaker_name: string | null;
  speaker_title: string | null;
  sort_order: number;
};

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function ScheduleRow({
  item,
  eventId,
  locale,
  dragHandle,
}: {
  item: Item;
  eventId: string;
  locale: string;
  dragHandle?: ReactNode;
}) {
  const t = SR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof SR_T];

  const timeRange = `${new Date(item.starts_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${new Date(item.ends_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={item.title_en}
      meta={
        <>
          <span>{timeRange}</span>
          {item.speaker_name && (
            <span>
              {" · "}
              {item.speaker_name}
              {item.speaker_title && (
                <span className="text-muted-foreground">
                  {" — "}
                  {item.speaker_title}
                </span>
              )}
            </span>
          )}
        </>
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteScheduleItem(item.id, eventId, locale)}
          confirmTitle={t.deleteConfirm.replace("{title}", item.title_en)}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deletedToast}
          compact
        />
      }
      renderEdit={({ close }) => (
        <ScheduleEditForm
          item={item}
          eventId={eventId}
          locale={locale}
          t={t}
          onSaved={close}
        />
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */

type ScheduleT = (typeof SR_T)[keyof typeof SR_T];
type ActionResult = { error?: string; success?: boolean } | null;

function ScheduleEditForm({
  item,
  eventId,
  locale,
  t,
  onSaved,
}: {
  item: Item;
  eventId: string;
  locale: string;
  t: ScheduleT;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return updateScheduleItem(item.id, formData);
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
      toast.success(t.savedToast);
      onSaved();
    }
  }, [state, t.savedToast, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.titleEn} required>
          <Input name="title_en" defaultValue={item.title_en} required />
        </FormField>
        <FormField label={t.titleDe}>
          <Input name="title_de" defaultValue={item.title_de ?? ""} />
        </FormField>
        <FormField label={t.titleFr}>
          <Input name="title_fr" defaultValue={item.title_fr ?? ""} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start" required>
          <Input
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocal(item.starts_at)}
            required
          />
        </FormField>
        <FormField label="End" required>
          <Input
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocal(item.ends_at)}
            required
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.speakerName}>
          <Input name="speaker_name" defaultValue={item.speaker_name ?? ""} />
        </FormField>
        <FormField label={t.speakerTitle}>
          <Input name="speaker_title" defaultValue={item.speaker_title ?? ""} />
        </FormField>
        <FormField label={t.sort}>
          <Input name="sort_order" type="number" defaultValue={item.sort_order} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.descEn}>
          <Textarea
            name="description_en"
            defaultValue={item.description_en ?? ""}
            rows={2}
          />
        </FormField>
        <FormField label={t.descDe}>
          <Textarea
            name="description_de"
            defaultValue={item.description_de ?? ""}
            rows={2}
          />
        </FormField>
        <FormField label={t.descFr}>
          <Textarea
            name="description_fr"
            defaultValue={item.description_fr ?? ""}
            rows={2}
          />
        </FormField>
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
