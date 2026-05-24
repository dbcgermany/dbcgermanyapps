"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Camera, Film, Link2, type LucideIcon } from "lucide-react";
import { Button, FormField, Input } from "@dbc/ui";
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
    savedToast: "Saved",
    delete: "Delete", deleteConfirm: "Delete this media item?",
    deletedToast: "Item deleted",
  },
  de: {
    titleCaption: "Titel / Bildunterschrift", url: "URL", sort: "Sortierung",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    savedToast: "Gespeichert",
    delete: "Löschen", deleteConfirm: "Dieses Medium löschen?",
    deletedToast: "Element gelöscht",
  },
  fr: {
    titleCaption: "Titre / légende", url: "URL", sort: "Ordre",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    savedToast: "Enregistré",
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

type ActionResult = { error?: string; success?: boolean } | null;

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
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return updateEventMedia(item.id, formData);
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
      <FormField label={t.titleCaption}>
        <Input name="title" defaultValue={item.title ?? ""} />
      </FormField>
      <FormField label={t.url}>
        <Input name="url" type="url" defaultValue={item.url} />
      </FormField>
      <FormField label={t.sort}>
        <Input name="sort_order" type="number" defaultValue={item.sort_order} />
      </FormField>
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
