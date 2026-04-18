"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import {
  updateRunsheetItem,
  deleteRunsheetItem,
  type RunsheetItem,
} from "@/actions/runsheet";

const STATUS_CYCLE: Record<string, "pending" | "in_progress" | "done"> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "warning" | "success"
> = {
  pending: "default",
  in_progress: "warning",
  done: "success",
};

const RR_T = {
  en: {
    title: "Title", unassigned: "Unassigned", location: "Location", notes: "Notes / description",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    advance: "Advance", edit: "Edit", delete: "Delete", deleteConfirm: 'Delete "{title}"?',
    statuses: { pending: "Pending", in_progress: "In progress", done: "Done" } as Record<string, string>,
  },
  de: {
    title: "Titel", unassigned: "Nicht zugewiesen", location: "Ort", notes: "Notizen / Beschreibung",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    advance: "Weiter", edit: "Bearbeiten", delete: "Löschen", deleteConfirm: "„{title}“ löschen?",
    statuses: { pending: "Offen", in_progress: "Läuft", done: "Erledigt" } as Record<string, string>,
  },
  fr: {
    title: "Titre", unassigned: "Non assigné", location: "Lieu", notes: "Notes / description",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    advance: "Avancer", edit: "Modifier", delete: "Supprimer", deleteConfirm: "Supprimer « {title} » ?",
    statuses: { pending: "En attente", in_progress: "En cours", done: "Terminé" } as Record<string, string>,
  },
} as const;

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function RunsheetRow({
  item,
  eventId,
  locale,
  staff,
}: {
  item: RunsheetItem;
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isPending, startTransition] = useTransition();
  const t = RR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof RR_T];

  const [state, formAction, isSaving] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateRunsheetItem(item.id, formData);
      if (result.success) {
        setMode("view");
        router.refresh();
      }
      return result;
    },
    null
  );

  function handleStatusAdvance() {
    const next = STATUS_CYCLE[item.status] ?? "pending";
    const fd = new FormData();
    fd.set("event_id", eventId);
    fd.set("locale", locale);
    fd.set("status", next);
    startTransition(async () => {
      await updateRunsheetItem(item.id, fd);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(t.deleteConfirm.replace("{title}", item.title))) return;
    startTransition(async () => {
      await deleteRunsheetItem(item.id, eventId, locale);
      router.refresh();
    });
  }

  const assigneeName =
    item.assignee?.display_name || item.responsible_person || null;

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
        <input
          name="title"
          defaultValue={item.title}
          required
          placeholder={t.title}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
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
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            name="assigned_to"
            defaultValue={item.assigned_to ?? ""}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">{t.unassigned}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            name="location_note"
            defaultValue={item.location_note ?? ""}
            placeholder={t.location}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <textarea
          name="description"
          defaultValue={item.description ?? ""}
          placeholder={t.notes}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? t.saving : t.save}
          </button>
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
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <p className="font-medium">{item.title}</p>
          <Badge variant={STATUS_VARIANT[item.status] ?? "default"}>
            {t.statuses[item.status] ?? item.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Date(item.starts_at).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {item.ends_at && (
            <>
              {" \u2013 "}
              {new Date(item.ends_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          )}
        </p>
        {(assigneeName || item.location_note) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {assigneeName && <span>{assigneeName}</span>}
            {assigneeName && item.location_note && (
              <span className="mx-1.5">&middot;</span>
            )}
            {item.location_note && <span>{item.location_note}</span>}
          </p>
        )}
        {item.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleStatusAdvance}
          disabled={isPending}
          className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
        >
          {t.advance}
        </button>
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          {t.edit}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {t.delete}
        </button>
      </div>
    </div>
  );
}
