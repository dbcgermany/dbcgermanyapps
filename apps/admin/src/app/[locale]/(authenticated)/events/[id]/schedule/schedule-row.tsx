"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@dbc/ui";
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
    delete: "Delete", deleteConfirm: 'Delete "{title}"?',
    deletedToast: "Item deleted",
  },
  de: {
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    speakerName: "Name Speaker", speakerTitle: "Titel Speaker", sort: "Sort.",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    delete: "Löschen", deleteConfirm: "„{title}“ löschen?",
    deletedToast: "Eintrag gelöscht",
  },
  fr: {
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    speakerName: "Nom de l’intervenant", speakerTitle: "Titre de l’intervenant", sort: "Ordre",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
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
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateScheduleItem(item.id, formData);
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
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          name="title_en"
          defaultValue={item.title_en}
          required
          placeholder={t.titleEn}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="title_de"
          defaultValue={item.title_de ?? ""}
          placeholder={t.titleDe}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="title_fr"
          defaultValue={item.title_fr ?? ""}
          placeholder={t.titleFr}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="starts_at"
          type="datetime-local"
          defaultValue={toLocal(item.starts_at)}
          required
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="ends_at"
          type="datetime-local"
          defaultValue={toLocal(item.ends_at)}
          required
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          name="speaker_name"
          defaultValue={item.speaker_name ?? ""}
          placeholder={t.speakerName}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="speaker_title"
          defaultValue={item.speaker_title ?? ""}
          placeholder={t.speakerTitle}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <input
          name="sort_order"
          type="number"
          defaultValue={item.sort_order}
          placeholder={t.sort}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <textarea
          name="description_en"
          defaultValue={item.description_en ?? ""}
          placeholder={t.descEn}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <textarea
          name="description_de"
          defaultValue={item.description_de ?? ""}
          placeholder={t.descDe}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <textarea
          name="description_fr"
          defaultValue={item.description_fr ?? ""}
          placeholder={t.descFr}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
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
