"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateEvent } from "@/actions/events";

type EventRow = {
  id: string;
  title_en: string;
  title_de: string | null;
  title_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  event_type: string;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  timezone: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  max_tickets_per_order: number | null;
  cover_image_url: string | null;
  updated_at: string;
};

// datetime-local needs "YYYY-MM-DDTHH:mm" without timezone suffix.
function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

export function EditEventForm({
  locale,
  event,
}: {
  locale: string;
  event: EventRow;
}) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("locale", locale);
      formData.set("updated_at", event.updated_at);
      return updateEvent(event.id, formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      router.push(`/${locale}/events/${event.id}`);
      router.refresh();
    }
  }, [state, router, locale, event.id]);

  return (
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
              defaultChecked={event.event_type === "conference"}
              className="accent-primary"
            />
            Conference
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="event_type"
              value="masterclass"
              defaultChecked={event.event_type === "masterclass"}
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
        {(
          [
            { name: "title_en", label: "English", value: event.title_en, required: true },
            { name: "title_de", label: "Deutsch", value: event.title_de ?? "" },
            { name: "title_fr", label: "Fran\u00e7ais", value: event.title_fr ?? "" },
          ] as const
        ).map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="text"
              required={"required" in field ? field.required : false}
              defaultValue={field.value}
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
        {(
          [
            { name: "description_en", label: "English", value: event.description_en ?? "" },
            { name: "description_de", label: "Deutsch", value: event.description_de ?? "" },
            { name: "description_fr", label: "Fran\u00e7ais", value: event.description_fr ?? "" },
          ] as const
        ).map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={4}
              defaultValue={field.value}
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
            defaultValue={event.venue_name ?? ""}
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
            defaultValue={event.city ?? "Essen"}
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
          defaultValue={event.venue_address ?? ""}
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
            defaultValue={toDatetimeLocal(event.starts_at)}
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
            defaultValue={toDatetimeLocal(event.ends_at)}
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
            defaultValue={event.capacity}
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
            defaultValue={event.max_tickets_per_order ?? 10}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Cover image */}
      <div>
        <label htmlFor="cover_image_url" className="block text-sm font-medium mb-1">
          Cover image URL
        </label>
        <input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          defaultValue={event.cover_image_url ?? ""}
          placeholder="https://example.com/hero.jpg"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt="Current cover"
            className="mt-2 h-32 w-auto rounded-md border border-border object-cover"
          />
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Hero image shown on the public event page. Use a public URL.
        </p>
      </div>

      <input
        type="hidden"
        name="timezone"
        value={event.timezone ?? "Europe/Berlin"}
      />

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <a
          href={`/${locale}/events/${event.id}`}
          className="rounded-md border border-input px-6 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
