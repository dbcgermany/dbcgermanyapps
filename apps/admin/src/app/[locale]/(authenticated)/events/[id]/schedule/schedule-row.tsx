"use client";

import { useActionState, useState } from "react";
import { Button } from "@dbc/ui";
import {
  updateScheduleItem,
  deleteScheduleItem,
} from "@/actions/schedule";

const SR_T = {
  en: {
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    speakerName: "Speaker name", speakerTitle: "Speaker title", sort: "Sort",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    edit: "Edit", delete: "Delete", deleteConfirm: 'Delete "{title}"?',
  },
  de: {
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    speakerName: "Name Sprecher:in", speakerTitle: "Titel Sprecher:in", sort: "Sort.",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    edit: "Bearbeiten", delete: "Löschen", deleteConfirm: "„{title}“ löschen?",
  },
  fr: {
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    speakerName: "Nom de l’intervenant", speakerTitle: "Titre de l’intervenant", sort: "Ordre",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    edit: "Modifier", delete: "Supprimer", deleteConfirm: "Supprimer « {title} » ?",
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
}: {
  item: Item;
  eventId: string;
  locale: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const t = SR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof SR_T];

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateScheduleItem(item.id, formData);
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
    <div className="flex items-start justify-between rounded-lg border border-border p-4">
      <div>
        <p className="font-medium">{item.title_en}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Date(item.starts_at).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" \u2013 "}
          {new Date(item.ends_at).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {item.speaker_name && (
          <p className="mt-1 text-sm">
            {item.speaker_name}
            {item.speaker_title && (
              <span className="text-muted-foreground">
                {" \u2014 "}
                {item.speaker_title}
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          {t.edit}
        </button>
        <form
          action={async () => {
            if (!confirm(t.deleteConfirm.replace("{title}", item.title_en))) return;
            await deleteScheduleItem(item.id, eventId, locale);
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
  );
}
