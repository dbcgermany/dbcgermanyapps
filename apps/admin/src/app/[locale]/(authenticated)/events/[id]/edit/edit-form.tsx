"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPE_VALUES, type EventType } from "@dbc/types";
import { Button, LinkButton } from "@dbc/ui";
import { updateEvent } from "@/actions/events";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { PaymentMethodsSelect } from "@/components/payment-methods-select";

const T = {
  en: {
    eventType: "Event type", conference: "Conference", masterclass: "Masterclass",
    slug: "URL slug", slugHelp: "Shown in public URLs. Leave unchanged to keep the current one.",
    title: "Title", description: "Description", trilingual: "(trilingual)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    venueName: "Venue name", city: "City", venueAddress: "Venue address",
    startDate: "Start date & time", endDate: "End date & time",
    capacity: "Capacity", maxPerOrder: "Max tickets per order",
    salesTargetTickets: "Sales target (tickets)",
    salesTargetRevenue: "Sales target revenue (€)",
    feedbackUrl: "Feedback survey URL",
    saving: "Saving…", saveChanges: "Save changes", cancel: "Cancel",
  },
  de: {
    eventType: "Veranstaltungstyp", conference: "Konferenz", masterclass: "Masterclass",
    slug: "URL-Kennung", slugHelp: "In öffentlichen URLs sichtbar. Unverändert lassen, um die aktuelle beizubehalten.",
    title: "Titel", description: "Beschreibung", trilingual: "(dreisprachig)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    venueName: "Veranstaltungsort", city: "Stadt", venueAddress: "Adresse",
    startDate: "Beginn (Datum & Uhrzeit)", endDate: "Ende (Datum & Uhrzeit)",
    capacity: "Kapazität", maxPerOrder: "Max. Tickets pro Bestellung",
    salesTargetTickets: "Verkaufsziel (Tickets)",
    salesTargetRevenue: "Umsatzziel (€)",
    feedbackUrl: "Feedback-Umfrage-URL",
    saving: "Wird gespeichert…", saveChanges: "Änderungen speichern", cancel: "Abbrechen",
  },
  fr: {
    eventType: "Type d’événement", conference: "Conférence", masterclass: "Masterclass",
    slug: "Identifiant d’URL", slugHelp: "Visible dans les URL publiques. Laissez inchangé pour conserver l’actuel.",
    title: "Titre", description: "Description", trilingual: "(trilingue)",
    english: "English", deutsch: "Deutsch", francais: "Français",
    venueName: "Nom du lieu", city: "Ville", venueAddress: "Adresse",
    startDate: "Début (date & heure)", endDate: "Fin (date & heure)",
    capacity: "Capacité", maxPerOrder: "Max. billets par commande",
    salesTargetTickets: "Objectif de vente (billets)",
    salesTargetRevenue: "Objectif de revenus (€)",
    feedbackUrl: "URL sondage post-événement",
    saving: "Enregistrement…", saveChanges: "Enregistrer les changements", cancel: "Annuler",
  },
} as const;

type EventRow = {
  id: string;
  slug: string;
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
  enabled_payment_methods: string[] | null;
  cover_image_url: string | null;
  feedback_survey_url: string | null;
  sales_target_tickets: number | null;
  sales_target_revenue_cents: number | null;
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
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

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
        <legend className="text-sm font-medium mb-2">{t.eventType}</legend>
        <div className="flex gap-4">
          {EVENT_TYPE_VALUES.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="event_type"
                value={value}
                defaultChecked={event.event_type === value}
                className="accent-primary"
              />
              {t[value as EventType]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* URL slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1">
          {t.slug}
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={event.slug}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t.slugHelp}</p>
      </div>

      {/* Titles (trilingual) */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">
          {t.title} <span className="text-muted-foreground">{t.trilingual}</span>
        </h2>
        {(
          [
            { name: "title_en", label: t.english, value: event.title_en, required: true },
            { name: "title_de", label: t.deutsch, value: event.title_de ?? "" },
            { name: "title_fr", label: t.francais, value: event.title_fr ?? "" },
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
          {t.description} <span className="text-muted-foreground">{t.trilingual}</span>
        </h2>
        {(
          [
            { name: "description_en", label: t.english, value: event.description_en ?? "" },
            { name: "description_de", label: t.deutsch, value: event.description_de ?? "" },
            { name: "description_fr", label: t.francais, value: event.description_fr ?? "" },
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
            {t.venueName}
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
            {t.city}
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
          {t.venueAddress}
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
            {t.startDate}
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
            {t.endDate}
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
            {t.capacity}
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
            {t.maxPerOrder}
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

      {/* Sales targets & feedback */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="sales_target_tickets" className="block text-sm font-medium mb-1">
            {t.salesTargetTickets}
          </label>
          <input
            id="sales_target_tickets"
            name="sales_target_tickets"
            type="number"
            min="0"
            defaultValue={event.sales_target_tickets ?? ""}
            placeholder="e.g. 500"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sales_target_revenue_eur" className="block text-sm font-medium mb-1">
            {t.salesTargetRevenue}
          </label>
          <input
            id="sales_target_revenue_eur"
            name="sales_target_revenue_eur"
            type="number"
            min="0"
            step="0.01"
            defaultValue={
              event.sales_target_revenue_cents != null
                ? (event.sales_target_revenue_cents / 100).toFixed(2)
                : ""
            }
            placeholder="e.g. 25000.00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="feedback_survey_url" className="block text-sm font-medium mb-1">
            {t.feedbackUrl}
          </label>
          <input
            id="feedback_survey_url"
            name="feedback_survey_url"
            type="url"
            defaultValue={event.feedback_survey_url ?? ""}
            placeholder="https://forms.google.com/..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <PaymentMethodsSelect
        locale={locale}
        initialValues={event.enabled_payment_methods ?? []}
      />

      <CoverImageUpload initialUrl={event.cover_image_url} />

      <input
        type="hidden"
        name="timezone"
        value={event.timezone ?? "Europe/Berlin"}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.saveChanges}
        </Button>
        <LinkButton
          href={`/${locale}/events/${event.id}`}
          variant="secondary"
        >
          {t.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
