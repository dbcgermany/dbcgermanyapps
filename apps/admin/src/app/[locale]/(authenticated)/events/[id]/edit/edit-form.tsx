"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  EVENT_BRANCH_VALUES,
  EVENT_TYPE_VALUES,
  type EventBranch,
  type EventType,
} from "@dbc/types";
import { Button, LinkButton } from "@dbc/ui";
import { updateEvent } from "@/actions/events";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { PaymentMethodsSelect } from "@/components/payment-methods-select";

type ActionResult = { error?: string; success?: boolean } | null;

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
  // Guest programs + flexibility knobs
  team_invite_quota?: number | null;
  team_invite_tier_id?: string | null;
  chapter_delegate_tier_id?: string | null;
  chapter_companion_tier_id?: string | null;
  chapter_companion_value_tier_id?: string | null;
  team_member_tier_id?: string | null;
  chapter_delegate_program_enabled?: boolean | null;
  catering_enabled?: boolean | null;
  catering_eligible_roles?: string[] | null;
  delegate_review_notify_email?: string | null;
  door_sale_enabled?: boolean | null;
  coupons_enabled?: boolean | null;
  waitlist_enabled?: boolean | null;
  ticket_transfer_enabled?: boolean | null;
  ticket_transfer_cutoff_hours?: number | null;
  refund_policy_days?: number | null;
  refund_policy_text_de?: string | null;
  refund_policy_text_en?: string | null;
  refund_policy_text_fr?: string | null;
  requires_photo_consent?: boolean | null;
  photo_consent_text_de?: string | null;
  photo_consent_text_en?: string | null;
  photo_consent_text_fr?: string | null;
  aftercare_emails_enabled?: boolean | null;
  check_in_opens_minutes_before?: number | null;
  check_in_closes_minutes_after?: number | null;
  max_total_tickets?: number | null;
  ticket_pdf_hero_url?: string | null;
  funnel_brand_accent_hex?: string | null;
  event_branch?: EventBranch | null;
  external_url?: string | null;
  tiers?: { id: string; name_en: string; name_de: string | null; price_cents: number; purpose: string | null }[];
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
  const tBranch = useTranslations("admin.events.branch");
  const tExternal = useTranslations("admin.events.externalUrl");

  const [branch, setBranch] = useState<EventBranch>(
    (event.event_branch as EventBranch | null) ?? "dbc_germany"
  );
  const isExternal = branch === "other";

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      formData.set("updated_at", event.updated_at);
      return updateEvent(event.id, formData);
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
      toast.success(t.saveChanges);
      router.push(`/${locale}/events/${event.id}`);
      router.refresh();
    }
  }, [state, router, locale, event.id, t.saveChanges]);

  return (
    <form action={formAction} className="mt-8 max-w-2xl space-y-6">
      {/* Branch (DBC Germany vs Other) */}
      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-2 text-sm font-medium">{tBranch("label")}</legend>
        <div className="flex flex-wrap gap-4">
          {EVENT_BRANCH_VALUES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="event_branch"
                value={value}
                checked={branch === value}
                onChange={() => setBranch(value)}
                className="accent-primary"
              />
              {tBranch(`values.${value}`)}
            </label>
          ))}
        </div>
        {isExternal && (
          <div className="mt-4 space-y-2">
            <label htmlFor="external_url" className="block text-sm font-medium">
              {tExternal("label")}
            </label>
            <input
              id="external_url"
              name="external_url"
              type="url"
              required={isExternal}
              defaultValue={event.external_url ?? ""}
              placeholder="https://"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">{tExternal("hint")}</p>
          </div>
        )}
      </fieldset>

      {/* Event Type (DBC Germany only) */}
      {!isExternal && (
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
      )}

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

      {/* Capacity + max-per-order — ticketing-only */}
      {!isExternal && (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t.capacity}</label>
          <p className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {(event.capacity ?? 0).toLocaleString()}
          </p>
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
      )}

      {/* Sales targets & feedback (ticketing-only) */}
      {!isExternal && (
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
      )}

      {!isExternal && (
      <PaymentMethodsSelect
        locale={locale}
        initialValues={event.enabled_payment_methods ?? []}
      />
      )}

      <CoverImageUpload initialUrl={event.cover_image_url} />

      <input
        type="hidden"
        name="timezone"
        value={event.timezone ?? "Europe/Berlin"}
      />

      {/* Guest program configuration (ticketing-only) */}
      {!isExternal && (
      <fieldset className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Guest program configuration
        </legend>
        <p className="text-xs text-muted-foreground">
          Pick which tier plays which role for this event. Leave a tier blank to disable that program.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Team-friend invite tier (€-discounted target)
            </label>
            <select
              name="team_invite_tier_id"
              defaultValue={event.team_invite_tier_id ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Disabled —</option>
              {(event.tiers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_de || t.name_en} · €{(t.price_cents / 100).toFixed(2)}
                  {t.purpose ? ` · ${t.purpose}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Slots per team member (default quota)
            </label>
            <input
              type="number"
              name="team_invite_quota"
              min="0"
              defaultValue={event.team_invite_quota ?? 3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Branch delegate tier (other-branch team members)
            </label>
            <select
              name="chapter_delegate_tier_id"
              defaultValue={event.chapter_delegate_tier_id ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Disabled —</option>
              {(event.tiers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_de || t.name_en}
                  {t.purpose ? ` · ${t.purpose}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Companion (+1) tier (operational, €0)
            </label>
            <select
              name="chapter_companion_tier_id"
              defaultValue={event.chapter_companion_tier_id ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Disabled —</option>
              {(event.tiers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_de || t.name_en}
                  {t.purpose ? ` · ${t.purpose}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Companion (+1) reference tier (display + access)
            </label>
            <select
              name="chapter_companion_value_tier_id"
              defaultValue={event.chapter_companion_value_tier_id ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {(event.tiers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_de || t.name_en} · €{(t.price_cents / 100).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Defines what value the +1 sees on the public register page and which tier they get access to at the venue. The +1 is still issued the free Companion tier above.
            </p>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Germany team-member tier
            </label>
            <select
              name="team_member_tier_id"
              defaultValue={event.team_member_tier_id ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Disabled —</option>
              {(event.tiers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_de || t.name_en}
                  {t.purpose ? ` · ${t.purpose}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Delegate review notification email
            </label>
            <input
              type="email"
              name="delegate_review_notify_email"
              defaultValue={event.delegate_review_notify_email ?? ""}
              placeholder="admin@dbc-germany.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="chapter_delegate_program_enabled" value="false" />
            <input
              type="checkbox"
              name="chapter_delegate_program_enabled"
              value="true"
              defaultChecked={event.chapter_delegate_program_enabled !== false}
              className="accent-primary"
            />
            Branch delegate program enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="catering_enabled" value="false" />
            <input
              type="checkbox"
              name="catering_enabled"
              value="true"
              defaultChecked={!!event.catering_enabled}
              className="accent-primary"
            />
            Catering enabled for this event
          </label>
        </div>
        <fieldset className="mt-2 rounded-md border border-border bg-background/40 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Catering access by role
          </legend>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Anyone with one of these active roles on this event gets catering access regardless of their ticket tier. Per-ticket overrides still win. Leave all unchecked to keep catering strictly tier-driven.
          </p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {[
              { value: "speaker", label: "Speaker" },
              { value: "moderator", label: "Moderator / Host" },
              { value: "sponsor", label: "Sponsor" },
              { value: "vip", label: "VIP" },
              { value: "institutional_guest", label: "Institutional guest" },
              { value: "team_member_de", label: "DBC Germany team" },
              { value: "team_member_external", label: "DBC international team" },
              { value: "chapter_delegate", label: "Chapter delegate" },
              { value: "delegate_companion", label: "Delegate companion (+1)" },
              { value: "partner", label: "Partner" },
              { value: "press", label: "Press" },
              { value: "staff", label: "Staff" },
              { value: "volunteer", label: "Volunteer" },
              { value: "contractor", label: "Contractor" },
              { value: "invited_guest", label: "Invited guest" },
            ].map((r) => (
              <label key={r.value} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  name="catering_eligible_roles"
                  value={r.value}
                  defaultChecked={
                    (event.catering_eligible_roles ?? []).includes(r.value)
                  }
                  className="accent-primary"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>
      )}

      {/* Event settings — operations, policy, email cadence, capacity (ticketing-only) */}
      {!isExternal && (
      <fieldset className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Event settings
        </legend>
        <p className="text-xs text-muted-foreground">
          Operations, policy, email cadence and capacity. Defaults apply if left blank.
        </p>

        {/* Master switches */}
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="door_sale_enabled" value="false" />
            <input
              type="checkbox"
              name="door_sale_enabled"
              value="true"
              defaultChecked={event.door_sale_enabled !== false}
              className="accent-primary"
            />
            Door sale enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="coupons_enabled" value="false" />
            <input
              type="checkbox"
              name="coupons_enabled"
              value="true"
              defaultChecked={event.coupons_enabled !== false}
              className="accent-primary"
            />
            Coupons enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="waitlist_enabled" value="false" />
            <input
              type="checkbox"
              name="waitlist_enabled"
              value="true"
              defaultChecked={!!event.waitlist_enabled}
              className="accent-primary"
            />
            Waitlist enabled
          </label>
        </div>

        {/* Capacity */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Max total tickets (overall venue cap)
            </label>
            <input
              type="number"
              name="max_total_tickets"
              min="0"
              defaultValue={event.max_total_tickets ?? ""}
              placeholder="leave blank for unlimited"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Funnel brand accent (#hex)
            </label>
            <input
              type="text"
              name="funnel_brand_accent_hex"
              defaultValue={event.funnel_brand_accent_hex ?? ""}
              placeholder="#C8102E"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Ticket transfer + refund policy */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm sm:col-span-1">
            <input type="hidden" name="ticket_transfer_enabled" value="false" />
            <input
              type="checkbox"
              name="ticket_transfer_enabled"
              value="true"
              defaultChecked={event.ticket_transfer_enabled !== false}
              className="accent-primary"
            />
            Ticket transfer enabled
          </label>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Transfer cutoff (hours before event)
            </label>
            <input
              type="number"
              name="ticket_transfer_cutoff_hours"
              min="0"
              defaultValue={event.ticket_transfer_cutoff_hours ?? 24}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Refund policy (days before event)
            </label>
            <input
              type="number"
              name="refund_policy_days"
              min="0"
              defaultValue={event.refund_policy_days ?? 14}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Refund policy texts */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Refund policy text (DE)
            </label>
            <textarea
              name="refund_policy_text_de"
              defaultValue={event.refund_policy_text_de ?? ""}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Refund policy text (EN)
            </label>
            <textarea
              name="refund_policy_text_en"
              defaultValue={event.refund_policy_text_en ?? ""}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Refund policy text (FR)
            </label>
            <textarea
              name="refund_policy_text_fr"
              defaultValue={event.refund_policy_text_fr ?? ""}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Photo / video consent */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="hidden" name="requires_photo_consent" value="false" />
            <input
              type="checkbox"
              name="requires_photo_consent"
              value="true"
              defaultChecked={!!event.requires_photo_consent}
              className="accent-primary"
            />
            Require photo / video consent at checkout
          </label>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Photo consent text (DE)
            </label>
            <textarea
              name="photo_consent_text_de"
              defaultValue={event.photo_consent_text_de ?? ""}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Photo consent text (EN)
            </label>
            <textarea
              name="photo_consent_text_en"
              defaultValue={event.photo_consent_text_en ?? ""}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Photo consent text (FR)
            </label>
            <textarea
              name="photo_consent_text_fr"
              defaultValue={event.photo_consent_text_fr ?? ""}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Email cadence + check-in window */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="aftercare_emails_enabled" value="false" />
            <input
              type="checkbox"
              name="aftercare_emails_enabled"
              value="true"
              defaultChecked={event.aftercare_emails_enabled !== false}
              className="accent-primary"
            />
            Aftercare emails
          </label>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Check-in opens (min before)
            </label>
            <input
              type="number"
              name="check_in_opens_minutes_before"
              min="0"
              defaultValue={event.check_in_opens_minutes_before ?? 60}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Check-in closes (min after start)
            </label>
            <input
              type="number"
              name="check_in_closes_minutes_after"
              min="0"
              defaultValue={event.check_in_closes_minutes_after ?? 180}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Ticket PDF hero image URL
          </label>
          <input
            type="text"
            name="ticket_pdf_hero_url"
            defaultValue={event.ticket_pdf_hero_url ?? ""}
            placeholder="https://…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </fieldset>
      )}

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
