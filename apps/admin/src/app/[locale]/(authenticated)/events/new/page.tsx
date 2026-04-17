"use client";

import { useActionState } from "react";
import { createEvent } from "@/actions/events";
import { use } from "react";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { PageHeader } from "@/components/page-header";

export default function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createEvent(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader title="Create Event" />

      <form action={formAction} className="mt-8 max-w-2xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        {/* Event Type */}
        <fieldset>
          <legend className="text-sm font-medium mb-2">Event type</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="event_type"
                value="conference"
                defaultChecked
                className="accent-primary"
              />
              Conference
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="event_type"
                value="masterclass"
                className="accent-primary"
              />
              Masterclass
            </label>
          </div>
        </fieldset>

        {/* Titles (trilingual) */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">
            Title <span className="text-muted-foreground">(trilingual)</span>
          </h2>
          {[
            { name: "title_en", label: "English", required: true },
            { name: "title_de", label: "Deutsch" },
            { name: "title_fr", label: "Fran\u00e7ais" },
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        {/* Descriptions (trilingual) */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">
            Description <span className="text-muted-foreground">(trilingual)</span>
          </h2>
          {[
            { name: "description_en", label: "English" },
            { name: "description_de", label: "Deutsch" },
            { name: "description_fr", label: "Fran\u00e7ais" },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
                {field.label}
              </label>
              <textarea
                id={field.name}
                name={field.name}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        {/* Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="venue_name" className="block text-sm font-medium mb-1">
              Venue name
            </label>
            <input
              id="venue_name"
              name="venue_name"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue="Essen"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="venue_address" className="block text-sm font-medium mb-1">
            Venue address
          </label>
          <input
            id="venue_address"
            name="venue_address"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="starts_at" className="block text-sm font-medium mb-1">
              Start date & time
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="ends_at" className="block text-sm font-medium mb-1">
              End date & time
            </label>
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Capacity & Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium mb-1">
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              required
              defaultValue="950"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="max_tickets_per_order" className="block text-sm font-medium mb-1">
              Max tickets per order
            </label>
            <input
              id="max_tickets_per_order"
              name="max_tickets_per_order"
              type="number"
              min="1"
              defaultValue="10"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <CoverImageUpload />

        <input type="hidden" name="timezone" value="Europe/Berlin" />

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
