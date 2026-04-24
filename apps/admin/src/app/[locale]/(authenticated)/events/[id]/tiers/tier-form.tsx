"use client";

import { useActionState } from "react";
import { createTier } from "@/actions/tiers";
import { Button } from "@dbc/ui";

const T = {
  en: {
    success: "Tier created successfully.",
    nameEn: "Name (EN)",
    nameDe: "Name (DE)",
    nameFr: "Name (FR)",
    priceLabel: "Current price (€)",
    originalPriceLabel: "Regular price (€) — optional",
    originalPriceHint:
      "Shown struck through on the public page. Leave empty to hide the discount.",
    maxQty: "Max quantity (empty = unlimited)",
    sortOrder: "Sort order",
    salesStart: "Sales start (optional)",
    salesEnd: "Sales end (optional)",
    publicTier: "Public tier (visible on event page)",
    publicHint: "Uncheck for invite-only / team / partner tiers",
    adding: "Adding…",
    addTier: "Add Tier",
  },
  de: {
    success: "Kategorie erfolgreich erstellt.",
    nameEn: "Name (EN)",
    nameDe: "Name (DE)",
    nameFr: "Name (FR)",
    priceLabel: "Aktueller Preis (€)",
    originalPriceLabel: "Regulärer Preis (€) — optional",
    originalPriceHint:
      "Auf der öffentlichen Seite durchgestrichen angezeigt. Leer lassen, um den Rabatt auszublenden.",
    maxQty: "Maximale Menge (leer = unbegrenzt)",
    sortOrder: "Sortierung",
    salesStart: "Verkaufsstart (optional)",
    salesEnd: "Verkaufsende (optional)",
    publicTier: "Öffentliche Kategorie (auf Event-Seite sichtbar)",
    publicHint:
      "Deaktivieren für Einladungs-, Team- oder Partnerkategorien",
    adding: "Wird hinzugefügt…",
    addTier: "Kategorie hinzufügen",
  },
  fr: {
    success: "Catégorie créée avec succès.",
    nameEn: "Nom (EN)",
    nameDe: "Nom (DE)",
    nameFr: "Nom (FR)",
    priceLabel: "Prix actuel (€)",
    originalPriceLabel: "Prix régulier (€) — optionnel",
    originalPriceHint:
      "Affiché barré sur la page publique. Laisser vide pour masquer la remise.",
    maxQty: "Quantité max (vide = illimité)",
    sortOrder: "Ordre",
    salesStart: "Début des ventes (optionnel)",
    salesEnd: "Fin des ventes (optionnel)",
    publicTier: "Catégorie publique (visible sur la page événement)",
    publicHint:
      "Décochez pour les catégories invités / équipe / partenaires",
    adding: "Ajout…",
    addTier: "Ajouter la catégorie",
  },
} as const;

export function TierForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createTier(formData);
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
          {t.success}
        </div>
      )}

      {/* Names */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="name_en" className="block text-xs text-muted-foreground mb-1">
            {t.nameEn}
          </label>
          <input
            id="name_en"
            name="name_en"
            type="text"
            required
            placeholder="e.g., Early Bird"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="name_de" className="block text-xs text-muted-foreground mb-1">
            {t.nameDe}
          </label>
          <input
            id="name_de"
            name="name_de"
            type="text"
            placeholder="e.g., Frühbucher"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="name_fr" className="block text-xs text-muted-foreground mb-1">
            {t.nameFr}
          </label>
          <input
            id="name_fr"
            name="name_fr"
            type="text"
            placeholder="e.g., Prévente"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Price */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-xs text-muted-foreground mb-1">
            {t.priceLabel}
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="49.00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="original_price" className="block text-xs text-muted-foreground mb-1">
            {t.originalPriceLabel}
          </label>
          <input
            id="original_price"
            name="original_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="99.00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {t.originalPriceHint}
          </p>
        </div>
      </div>

      {/* Quantity & sort order */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="max_quantity" className="block text-xs text-muted-foreground mb-1">
            {t.maxQty}
          </label>
          <input
            id="max_quantity"
            name="max_quantity"
            type="number"
            min="1"
            placeholder="200"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-xs text-muted-foreground mb-1">
            {t.sortOrder}
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

      {/* Sale dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="sales_start_at" className="block text-xs text-muted-foreground mb-1">
            {t.salesStart}
          </label>
          <input
            id="sales_start_at"
            name="sales_start_at"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sales_end_at" className="block text-xs text-muted-foreground mb-1">
            {t.salesEnd}
          </label>
          <input
            id="sales_end_at"
            name="sales_end_at"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="hidden"
            name="is_public"
            value="false"
          />
          <input
            type="checkbox"
            name="is_public"
            value="true"
            defaultChecked
            className="accent-primary"
          />
          {t.publicTier}
        </label>
        <p className="ml-6 text-xs text-muted-foreground">
          {t.publicHint}
        </p>
      </div>

      <Button type="submit"
        disabled={isPending}>
        {isPending ? t.adding : t.addTier}
      </Button>
    </form>
  );
}
