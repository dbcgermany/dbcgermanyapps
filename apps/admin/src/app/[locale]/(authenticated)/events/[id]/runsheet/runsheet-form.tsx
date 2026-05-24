"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { createRunsheetItem } from "@/actions/runsheet";

const RF_T = {
  en: {
    success: "Run-sheet item added",
    title: "Task title *",
    titleHint: "Required. Shown on the run-sheet PDF + emails to assigned staff.",
    startTime: "Start time *",
    endTime: "End time (optional)",
    assignedTo: "Assigned to",
    unassigned: "Unassigned",
    location: "Location",
    notes: "Notes / description (visible to attendees on PDF)",
    privateNotes: "Private notes (team only — not on PDF or in emails)",
    adding: "Adding…",
    addItem: "Add item",
  },
  de: {
    success: "Eintrag hinzugefügt",
    title: "Titel der Aufgabe *",
    titleHint: "Erforderlich. Wird im Ablauf-PDF und in E-Mails an das zugewiesene Team gezeigt.",
    startTime: "Startzeit *",
    endTime: "Endzeit (optional)",
    assignedTo: "Zugewiesen an",
    unassigned: "Nicht zugewiesen",
    location: "Ort",
    notes: "Notizen / Beschreibung (für Teilnehmende im PDF sichtbar)",
    privateNotes: "Interne Notizen (nur fürs Team — nicht im PDF oder in E-Mails)",
    adding: "Wird hinzugefügt…",
    addItem: "Eintrag hinzufügen",
  },
  fr: {
    success: "Élément ajouté",
    title: "Intitulé *",
    titleHint: "Obligatoire. Affiché sur la feuille de route PDF et dans les e-mails au personnel assigné.",
    startTime: "Heure de début *",
    endTime: "Heure de fin (optionnel)",
    assignedTo: "Assigné à",
    unassigned: "Non assigné",
    location: "Lieu",
    notes: "Notes / description (visible aux participants dans le PDF)",
    privateNotes: "Notes internes (équipe uniquement — pas dans le PDF ni les e-mails)",
    adding: "Ajout…",
    addItem: "Ajouter",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function RunsheetForm({
  eventId,
  locale,
  staff,
}: {
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const t = RF_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof RF_T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      // datetime-local submits a tz-less string ("2026-06-13T18:30") but the
      // timestamptz column needs an actual instant — convert to UTC ISO.
      for (const field of ["starts_at", "ends_at"] as const) {
        const raw = formData.get(field);
        if (typeof raw === "string" && raw) {
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) {
            formData.set(field, d.toISOString());
          }
        }
      }
      return createRunsheetItem(eventId, formData);
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
      toast.success(t.success);
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router, t.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-6"
    >
      <FormField label={t.title} required hint={t.titleHint}>
        <Input name="title" required />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.startTime} required>
          <Input name="starts_at" type="datetime-local" required />
        </FormField>
        <FormField label={t.endTime}>
          <Input name="ends_at" type="datetime-local" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.assignedTo}>
          <Select name="assigned_to" defaultValue="">
            <option value="">{t.unassigned}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.location}>
          <Input name="location_note" />
        </FormField>
      </div>

      <FormField label={t.notes}>
        <Textarea name="description" rows={2} />
      </FormField>

      <FormField label={t.privateNotes}>
        <Textarea name="notes" rows={2} />
      </FormField>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.adding : t.addItem}
      </Button>
    </form>
  );
}
