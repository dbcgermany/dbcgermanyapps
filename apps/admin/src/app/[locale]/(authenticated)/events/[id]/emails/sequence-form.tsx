"use client";

import { useActionState } from "react";
import { createEmailSequence } from "@/actions/email-sequences";

export function SequenceForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createEmailSequence(formData);
    },
    null
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Sequence added.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="delay_days" className="block text-xs text-muted-foreground mb-1">
            Send N days after event ends
          </label>
          <input
            id="delay_days"
            name="delay_days"
            type="number"
            min="0"
            defaultValue="1"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-xs text-muted-foreground mb-1">
            Sort order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue="0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Subjects */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          Subject <span className="text-muted-foreground">(trilingual)</span>
        </h3>
        {[
          { name: "subject_en", label: "English", required: true },
          { name: "subject_de", label: "Deutsch" },
          { name: "subject_fr", label: "Fran\u00e7ais" },
        ].map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="text"
              required={field.required}
              placeholder="Thank you for attending {event}"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      {/* Bodies */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          Body <span className="text-muted-foreground">(trilingual)</span>
        </h3>
        {[
          { name: "body_en", label: "English", required: true },
          { name: "body_de", label: "Deutsch" },
          { name: "body_fr", label: "Fran\u00e7ais" },
        ].map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={4}
              required={field.required}
              placeholder="Hi {name}, thank you for joining us..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add Sequence"}
      </button>
    </form>
  );
}
