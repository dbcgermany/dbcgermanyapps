"use client";

import { useActionState, type ReactNode } from "react";
import { Camera, Film, Link2, type LucideIcon } from "lucide-react";
import { Button } from "@dbc/ui";
import { updateEventMedia, deleteEventMedia } from "@/actions/media";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

type Media = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  sort_order: number;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  photo: Camera,
  video: Film,
  link: Link2,
};

const MR_T = {
  en: {
    titleCaption: "Title / caption", url: "URL", sort: "Sort order",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    delete: "Delete", deleteConfirm: "Delete this media item?",
    deletedToast: "Item deleted",
  },
  de: {
    titleCaption: "Titel / Bildunterschrift", url: "URL", sort: "Sortierung",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    delete: "Löschen", deleteConfirm: "Dieses Medium löschen?",
    deletedToast: "Element gelöscht",
  },
  fr: {
    titleCaption: "Titre / légende", url: "URL", sort: "Ordre",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    delete: "Supprimer", deleteConfirm: "Supprimer ce média ?",
    deletedToast: "Élément supprimé",
  },
} as const;

export function MediaRow({
  item,
  eventId,
  locale,
  dragHandle,
}: {
  item: Media;
  eventId: string;
  locale: string;
  dragHandle?: ReactNode;
}) {
  const t = MR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof MR_T];
  const Icon = TYPE_ICONS[item.type] ?? Camera;

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          <span>{item.title || item.type}</span>
        </span>
      }
      meta={
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs hover:text-primary"
        >
          {item.url}
        </a>
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteEventMedia(item.id, eventId, locale)}
          confirmTitle={t.deleteConfirm}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deletedToast}
          compact
        />
      }
      renderEdit={({ close }) => (
        <MediaEditForm
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

type MediaT = (typeof MR_T)[keyof typeof MR_T];

function MediaEditForm({
  item,
  eventId,
  locale,
  t,
  onSaved,
}: {
  item: Media;
  eventId: string;
  locale: string;
  t: MediaT;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateEventMedia(item.id, formData);
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
      <input
        name="title"
        defaultValue={item.title ?? ""}
        placeholder={t.titleCaption}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
      <input
        name="url"
        type="url"
        defaultValue={item.url}
        placeholder={t.url}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
      <input
        name="sort_order"
        type="number"
        defaultValue={item.sort_order}
        placeholder={t.sort}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
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
