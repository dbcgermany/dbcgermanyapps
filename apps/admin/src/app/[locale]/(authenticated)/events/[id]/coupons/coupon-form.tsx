"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Select } from "@dbc/ui";
import { createCoupon } from "@/actions/coupons";

const CP_T = {
  en: {
    success: "Coupon created successfully",
    codeLabel: "Coupon code *",
    codeHint: "Required. Buyers type this at checkout.",
    typeLabel: "Discount type",
    percentage: "Percentage (%)",
    fixed: "Fixed amount (€)",
    valueLabel: "Value *",
    maxUses: "Max uses",
    maxUsesHint: "Leave empty for unlimited.",
    validFrom: "Valid from (optional)",
    validUntil: "Valid until (optional)",
    appliesTo: "Applies to tiers",
    appliesAll: "Leave all unchecked = applies to every tier.",
    creating: "Creating…",
    create: "Create coupon",
  },
  de: {
    success: "Rabattcode erfolgreich erstellt",
    codeLabel: "Coupon-Code *",
    codeHint: "Erforderlich. Käufer geben diesen beim Checkout ein.",
    typeLabel: "Rabattart",
    percentage: "Prozentual (%)",
    fixed: "Festbetrag (€)",
    valueLabel: "Wert *",
    maxUses: "Max. Nutzungen",
    maxUsesHint: "Leer lassen für unbegrenzt.",
    validFrom: "Gültig ab (optional)",
    validUntil: "Gültig bis (optional)",
    appliesTo: "Gilt für Kategorien",
    appliesAll: "Nichts ankreuzen = gilt für alle Kategorien.",
    creating: "Wird erstellt…",
    create: "Rabattcode erstellen",
  },
  fr: {
    success: "Code promo créé avec succès",
    codeLabel: "Code promo *",
    codeHint: "Obligatoire. Les acheteurs le saisissent au paiement.",
    typeLabel: "Type de remise",
    percentage: "Pourcentage (%)",
    fixed: "Montant fixe (€)",
    valueLabel: "Valeur *",
    maxUses: "Nombre max",
    maxUsesHint: "Laisser vide pour illimité.",
    validFrom: "Valide à partir de (optionnel)",
    validUntil: "Valide jusqu’à (optionnel)",
    appliesTo: "S’applique aux catégories",
    appliesAll: "Aucune cochée = s’applique à toutes les catégories.",
    creating: "Création…",
    create: "Créer le code",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function CouponForm({
  eventId,
  locale,
  tiers,
}: {
  eventId: string;
  locale: string;
  tiers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const t = CP_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof CP_T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createCoupon(formData);
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
      router.refresh();
    }
  }, [state, router, t.success]);

  return (
    <form action={formAction} className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.codeLabel} required hint={t.codeHint}>
          <Input
            name="code"
            required
            placeholder="EARLYBIRD20"
            className="font-mono uppercase"
          />
        </FormField>
        <FormField label={t.typeLabel}>
          <Select name="discount_type" defaultValue="percentage">
            <option value="percentage">{t.percentage}</option>
            <option value="fixed_amount">{t.fixed}</option>
          </Select>
        </FormField>
        <FormField label={t.valueLabel} required>
          <Input
            name="discount_value"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="20"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.maxUses} hint={t.maxUsesHint}>
          <Input name="max_uses" type="number" min="1" placeholder="100" />
        </FormField>
        <FormField label={t.validFrom}>
          <Input name="valid_from" type="datetime-local" />
        </FormField>
        <FormField label={t.validUntil}>
          <Input name="valid_until" type="datetime-local" />
        </FormField>
      </div>

      {tiers.length > 0 && (
        <FormField label={t.appliesTo} hint={t.appliesAll}>
          <div className="grid gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-2">
            {tiers.map((tier) => (
              <label
                key={tier.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Input
                  type="checkbox"
                  name="applicable_tier_ids"
                  value={tier.id}
                  className="accent-primary"
                />
                {tier.name}
              </label>
            ))}
          </div>
        </FormField>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t.creating : t.create}
      </Button>
    </form>
  );
}
