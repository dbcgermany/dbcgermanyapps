"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRunsheetItem } from "@/actions/runsheet";
import { Button } from "@dbc/ui";

const RF_T = {
  en: { title: "Task title", unassigned: "Unassigned", location: "Location", notes: "Notes / description", adding: "Adding…", addItem: "Add item" },
  de: { title: "Titel der Aufgabe", unassigned: "Nicht zugewiesen", location: "Ort", notes: "Notizen / Beschreibung", adding: "Wird hinzugefügt…", addItem: "Eintrag hinzufügen" },
  fr: { title: "Intitulé", unassigned: "Non assigné", location: "Lieu", notes: "Notes / description", adding: "Ajout…", addItem: "Ajouter" },
} as const;

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

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("locale", locale);
      const result = await createRunsheetItem(eventId, formData);
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
    >
      {state?.error && (
        <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      <input
        name="title"
        placeholder={t.title}
        required
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="starts_at"
          type="datetime-local"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          name="ends_at"
          type="datetime-local"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="assigned_to"
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          placeholder={t.location}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="description"
        placeholder={t.notes}
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button type="submit"
        disabled={isPending}>
        {isPending ? t.adding : t.addItem}
      </Button>
    </form>
  );
}
