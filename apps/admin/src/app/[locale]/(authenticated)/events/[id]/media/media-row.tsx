"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Camera, Film, Link2, type LucideIcon } from "lucide-react";
import { updateEventMedia, deleteEventMedia } from "@/actions/media";
import { Button, ConfirmDialog } from "@dbc/ui";

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
    edit: "Edit", delete: "Delete", deleteConfirm: "Delete this media item?",
  },
  de: {
    titleCaption: "Titel / Bildunterschrift", url: "URL", sort: "Sortierung",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    edit: "Bearbeiten", delete: "Löschen", deleteConfirm: "Dieses Medium löschen?",
  },
  fr: {
    titleCaption: "Titre / légende", url: "URL", sort: "Ordre",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    edit: "Modifier", delete: "Supprimer", deleteConfirm: "Supprimer ce média ?",
  },
} as const;

export function MediaRow({
  item,
  eventId,
  locale,
}: {
  item: Media;
  eventId: string;
  locale: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const t = MR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof MR_T];
  const router = useRouter();
  const tCommon = useTranslations("admin.common");

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateEventMedia(item.id, formData);
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
    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
      {(() => { const Icon = TYPE_ICONS[item.type] ?? Camera; return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />; })()}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title || item.type}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-primary"
        >
          {item.url}
        </a>
      </div>
      <div className="flex flex-col gap-1 shrink-0 items-end">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          {t.edit}
        </button>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              className="text-xs text-danger hover:opacity-80"
            >
              {t.delete}
            </button>
          }
          title={t.deleteConfirm}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          variant="danger"
          onConfirm={async () => {
            const res = await deleteEventMedia(item.id, eventId, locale);
            if (res?.error) {
              toast.error(tCommon("actionFailedToast", { error: res.error }));
              return;
            }
            toast.success(tCommon("deletedToast"));
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
