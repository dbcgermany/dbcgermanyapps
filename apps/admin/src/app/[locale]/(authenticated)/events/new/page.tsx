"use client";

import { useActionState, use } from "react";
import { useTranslations } from "next-intl";
import { EVENT_TYPE_VALUES, type EventType } from "@dbc/types";
import { createEvent } from "@/actions/events";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { PageHeader } from "@/components/page-header";

const T = {
  en: {
    pageTitle: "Create Event",
    eventType: "Event type",
    conference: "Conference",
    masterclass: "Masterclass",
    title: "Title",
    description: "Description",
    trilingual: "(trilingual)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    venueName: "Venue name",
    city: "City",
    venueAddress: "Venue address",
    startDate: "Start date & time",
    endDate: "End date & time",
    capacity: "Capacity",
    maxPerOrder: "Max tickets per order",
    creating: "Creating…",
    createEvent: "Create Event",
  },
  de: {
    pageTitle: "Veranstaltung anlegen",
    eventType: "Veranstaltungstyp",
    conference: "Konferenz",
    masterclass: "Masterclass",
    title: "Titel",
    description: "Beschreibung",
    trilingual: "(dreisprachig)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    venueName: "Veranstaltungsort",
    city: "Stadt",
    venueAddress: "Adresse",
    startDate: "Beginn (Datum & Uhrzeit)",
    endDate: "Ende (Datum & Uhrzeit)",
    capacity: "Kapazität",
    maxPerOrder: "Max. Tickets pro Bestellung",
    creating: "Wird erstellt…",
    createEvent: "Veranstaltung erstellen",
  },
  fr: {
    pageTitle: "Créer un événement",
    eventType: "Type d’événement",
    conference: "Conférence",
    masterclass: "Masterclass",
    title: "Titre",
    description: "Description",
    trilingual: "(trilingue)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    venueName: "Nom du lieu",
    city: "Ville",
    venueAddress: "Adresse",
    startDate: "Début (date & heure)",
    endDate: "Fin (date & heure)",
    capacity: "Capacité",
    maxPerOrder: "Max. billets par commande",
    creating: "Création…",
    createEvent: "Créer l’événement",
  },
} as const;

export default function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = useTranslations("admin.back");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createEvent(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader
        title={t.pageTitle}
        back={{ href: `/${locale}/events`, label: tBack("events") }}
      />

      <form action={formAction} className="mt-8 max-w-2xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        {/* Event Type */}
        <fieldset>
          <legend className="text-sm font-medium mb-2">{t.eventType}</legend>
          <div className="flex gap-4">
            {EVENT_TYPE_VALUES.map((value, i) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="event_type"
                  value={value}
                  defaultChecked={i === 0}
                  className="accent-primary"
                />
                {t[value as EventType]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Titles (trilingual) */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">
            {t.title} <span className="text-muted-foreground">{t.trilingual}</span>
          </h2>
          {[
            { name: "title_en", label: t.english, required: true },
            { name: "title_de", label: t.deutsch },
            { name: "title_fr", label: t.francais },
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
            {t.description} <span className="text-muted-foreground">{t.trilingual}</span>
          </h2>
          {[
            { name: "description_en", label: t.english },
            { name: "description_de", label: t.deutsch },
            { name: "description_fr", label: t.francais },
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
              {t.venueName}
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
              {t.city}
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
            {t.venueAddress}
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
              {t.startDate}
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
              {t.endDate}
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
              {t.capacity}
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
              {t.maxPerOrder}
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
            {isPending ? t.creating : t.createEvent}
          </button>
        </div>
      </form>
    </div>
  );
}
