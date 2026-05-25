"use client";

import { useActionState, useEffect, useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge, Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import {
  updateRunsheetItem,
  deleteRunsheetItem,
  type RunsheetItem,
} from "@/actions/runsheet";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

const STATUS_CYCLE: Record<string, "pending" | "in_progress" | "done"> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const STATUS_VARIANT: Record<string, "default" | "warning" | "success"> = {
  pending: "default",
  in_progress: "warning",
  done: "success",
};

const RR_T = {
  en: {
    title: "Title", unassigned: "Unassigned", location: "Location", notes: "Notes / description",
    privateNotes: "Private notes (team only — not on PDF or in emails)",
    privateNotesHint: "Internal-only. Won't appear on the run-sheet PDF or in any attendee email.",
    privateNotesDisplay: "Team note",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    savedToast: "Saved",
    advance: "Advance", delete: "Delete", deleteConfirm: 'Delete "{title}"?',
    deletedToast: "Item deleted",
    statuses: { pending: "Pending", in_progress: "In progress", done: "Done" } as Record<string, string>,
  },
  de: {
    title: "Titel", unassigned: "Nicht zugewiesen", location: "Ort", notes: "Notizen / Beschreibung",
    privateNotes: "Interne Notizen (nur fürs Team — nicht im PDF oder in E-Mails)",
    privateNotesHint: "Nur intern. Erscheint weder im Ablaufplan-PDF noch in E-Mails an Teilnehmende.",
    privateNotesDisplay: "Team-Notiz",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    savedToast: "Gespeichert",
    advance: "Weiter", delete: "Löschen", deleteConfirm: "„{title}“ löschen?",
    deletedToast: "Eintrag gelöscht",
    statuses: { pending: "Offen", in_progress: "Läuft", done: "Erledigt" } as Record<string, string>,
  },
  fr: {
    title: "Titre", unassigned: "Non assigné", location: "Lieu", notes: "Notes / description",
    privateNotes: "Notes internes (équipe uniquement — pas dans le PDF ni les e-mails)",
    privateNotesHint: "Visible uniquement par l’équipe. N’apparaît ni dans la feuille de route PDF ni dans les e-mails aux participants.",
    privateNotesDisplay: "Note équipe",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    savedToast: "Enregistré",
    advance: "Avancer", delete: "Supprimer", deleteConfirm: "Supprimer « {title} » ?",
    deletedToast: "Élément supprimé",
    statuses: { pending: "En attente", in_progress: "En cours", done: "Terminé" } as Record<string, string>,
  },
} as const;

function toLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromLocal(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function RunsheetRow({
  item,
  eventId,
  locale,
  staff,
  dragHandle,
}: {
  item: RunsheetItem;
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
  dragHandle?: ReactNode;
}) {
  const router = useRouter();
  const tCommon = useTranslations("admin.common");
  const [isPending, startTransition] = useTransition();
  const t = RR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof RR_T];

  function handleStatusAdvance() {
    const next = STATUS_CYCLE[item.status] ?? "pending";
    const fd = new FormData();
    fd.set("event_id", eventId);
    fd.set("locale", locale);
    fd.set("status", next);
    startTransition(async () => {
      const res = await updateRunsheetItem(item.id, fd);
      if (res?.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
        return;
      }
      toast.success(tCommon("savedToast"));
      router.refresh();
    });
  }

  const assigneeName =
    item.assignee?.display_name || item.responsible_person || null;

  const timeRange = (() => {
    const start = new Date(item.starts_at).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!item.ends_at) return start;
    const end = new Date(item.ends_at).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} – ${end}`;
  })();

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={item.title}
      badges={
        <Badge variant={STATUS_VARIANT[item.status] ?? "default"}>
          {t.statuses[item.status] ?? item.status.replace("_", " ")}
        </Badge>
      }
      meta={
        <>
          <div>
            <span>{timeRange}</span>
            {(assigneeName || item.location_note) && (
              <span>
                {" · "}
                {assigneeName}
                {assigneeName && item.location_note && " · "}
                {item.location_note}
              </span>
            )}
          </div>
          {item.description && (
            <div className="mt-1">{item.description}</div>
          )}
          {item.notes && (
            <div className="mt-2 rounded-md border-l-2 border-warning-strong bg-warning-soft px-2 py-1 text-xs">
              <span className="font-medium text-warning-strong">
                {t.privateNotesDisplay}:
              </span>{" "}
              <span className="whitespace-pre-wrap text-foreground/80">
                {item.notes}
              </span>
            </div>
          )}
        </>
      }
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStatusAdvance}
          disabled={isPending}
        >
          {t.advance}
        </Button>
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteRunsheetItem(item.id, eventId, locale)}
          confirmTitle={t.deleteConfirm.replace("{title}", item.title)}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deletedToast}
          compact
        />
      }
      renderEdit={({ close }) => (
        <RunsheetEditForm
          item={item}
          eventId={eventId}
          locale={locale}
          staff={staff}
          t={t}
          onSaved={close}
        />
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */

type RunsheetT = (typeof RR_T)[keyof typeof RR_T];
type ActionResult = { error?: string; success?: boolean } | null;

function RunsheetEditForm({
  item,
  eventId,
  locale,
  staff,
  t,
  onSaved,
}: {
  item: RunsheetItem;
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
  t: RunsheetT;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isSaving] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      // datetime-local inputs submit a tz-less string ("2026-06-13T18:30").
      // Convert to UTC ISO so the timestamptz column stores the actual
      // wall-clock instant the operator picked, not 18:30 UTC.
      for (const field of ["starts_at", "ends_at"] as const) {
        const raw = formData.get(field);
        if (typeof raw === "string") {
          formData.set(field, fromLocal(raw) ?? "");
        }
      }
      return updateRunsheetItem(item.id, formData);
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
      router.refresh();
    }
  }, [state, t.savedToast, onSaved, router]);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label={t.title} required>
        <Input name="title" defaultValue={item.title} required />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start" required>
          <Input
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocal(item.starts_at)}
            required
          />
        </FormField>
        <FormField label="End">
          <Input
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocal(item.ends_at)}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Assigned">
          <Select name="assigned_to" defaultValue={item.assigned_to ?? ""}>
            <option value="">{t.unassigned}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.location}>
          <Input name="location_note" defaultValue={item.location_note ?? ""} />
        </FormField>
      </div>
      <FormField label={t.notes}>
        <Textarea name="description" defaultValue={item.description ?? ""} rows={2} />
      </FormField>
      <FormField label={t.privateNotes} hint={t.privateNotesHint}>
        <Textarea name="notes" defaultValue={item.notes ?? ""} rows={2} />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t.saving : t.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onSaved}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
