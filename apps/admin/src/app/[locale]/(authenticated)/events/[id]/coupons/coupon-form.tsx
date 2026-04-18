"use client";

import { useActionState } from "react";
import { createCoupon } from "@/actions/coupons";

const CP_T = {
  en: {
    success: "Coupon created successfully.",
    codeLabel: "Code",
    typeLabel: "Type",
    percentage: "Percentage (%)",
    fixed: "Fixed amount (€)",
    valueLabel: "Value",
    maxUses: "Max uses (empty = unlimited)",
    validFrom: "Valid from (optional)",
    validUntil: "Valid until (optional)",
    appliesTo: "Applies to tiers",
    appliesAll: "(leave empty = all tiers)",
    creating: "Creating…",
    create: "Create Coupon",
  },
  de: {
    success: "Rabattcode erfolgreich erstellt.",
    codeLabel: "Code",
    typeLabel: "Typ",
    percentage: "Prozentual (%)",
    fixed: "Festbetrag (€)",
    valueLabel: "Wert",
    maxUses: "Max. Nutzungen (leer = unbegrenzt)",
    validFrom: "Gültig ab (optional)",
    validUntil: "Gültig bis (optional)",
    appliesTo: "Gilt für Kategorien",
    appliesAll: "(leer lassen = alle Kategorien)",
    creating: "Wird erstellt…",
    create: "Rabattcode erstellen",
  },
  fr: {
    success: "Code promo créé avec succès.",
    codeLabel: "Code",
    typeLabel: "Type",
    percentage: "Pourcentage (%)",
    fixed: "Montant fixe (€)",
    valueLabel: "Valeur",
    maxUses: "Nombre max (vide = illimité)",
    validFrom: "Valide à partir de (optionnel)",
    validUntil: "Valide jusqu’à (optionnel)",
    appliesTo: "S’applique aux catégories",
    appliesAll: "(vide = toutes les catégories)",
    creating: "Création…",
    create: "Créer le code",
  },
} as const;

export function CouponForm({
  eventId,
  locale,
  tiers,
}: {
  eventId: string;
  locale: string;
  tiers: { id: string; name: string }[];
}) {
  const t = CP_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof CP_T];
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createCoupon(formData);
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

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="code" className="block text-xs text-muted-foreground mb-1">
            {t.codeLabel}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            placeholder="EARLYBIRD20"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="discount_type" className="block text-xs text-muted-foreground mb-1">
            {t.typeLabel}
          </label>
          <select
            id="discount_type"
            name="discount_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="percentage">{t.percentage}</option>
            <option value="fixed_amount">{t.fixed}</option>
          </select>
        </div>
        <div>
          <label htmlFor="discount_value" className="block text-xs text-muted-foreground mb-1">
            {t.valueLabel}
          </label>
          <input
            id="discount_value"
            name="discount_value"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="20"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="max_uses" className="block text-xs text-muted-foreground mb-1">
            {t.maxUses}
          </label>
          <input
            id="max_uses"
            name="max_uses"
            type="number"
            min="1"
            placeholder="100"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="valid_from" className="block text-xs text-muted-foreground mb-1">
            {t.validFrom}
          </label>
          <input
            id="valid_from"
            name="valid_from"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="valid_until" className="block text-xs text-muted-foreground mb-1">
            {t.validUntil}
          </label>
          <input
            id="valid_until"
            name="valid_until"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {tiers.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            {t.appliesTo}
            <span className="ml-1 text-muted-foreground/70">
              {t.appliesAll}
            </span>
          </label>
          <div className="grid gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-2">
            {tiers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="applicable_tier_ids"
                  value={t.id}
                  className="accent-primary"
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.creating : t.create}
      </button>
    </form>
  );
}
