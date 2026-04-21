"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@dbc/ui";
import {
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
} from "@/actions/coupons";

const CR_T = {
  en: {
    percent: "Percentage (%)", fixed: "Fixed (€)",
    codePh: "CODE", value: "Value", maxUsesPh: "Max uses (empty=∞)",
    appliesTo: "Applies to tiers (empty = all)",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    inactive: "Inactive",
    off: "off", used: "used", tier: "tier", tiers: "tiers", only: "only",
    edit: "Edit", deactivate: "Deactivate", activate: "Activate",
    delete: "Delete", deleteConfirm: 'Delete coupon "{code}"?',
  },
  de: {
    percent: "Prozentual (%)", fixed: "Festbetrag (€)",
    codePh: "CODE", value: "Wert", maxUsesPh: "Max. Nutzungen (leer=∞)",
    appliesTo: "Gilt für Kategorien (leer = alle)",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    inactive: "Inaktiv",
    off: "Rabatt", used: "genutzt", tier: "Kategorie", tiers: "Kategorien", only: "nur",
    edit: "Bearbeiten", deactivate: "Deaktivieren", activate: "Aktivieren",
    delete: "Löschen", deleteConfirm: "Code „{code}“ löschen?",
  },
  fr: {
    percent: "Pourcentage (%)", fixed: "Fixe (€)",
    codePh: "CODE", value: "Valeur", maxUsesPh: "Nb max (vide=∞)",
    appliesTo: "S’applique aux catégories (vide = toutes)",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    inactive: "Inactif",
    off: "de remise", used: "utilisé(s)", tier: "catégorie", tiers: "catégories", only: "uniquement",
    edit: "Modifier", deactivate: "Désactiver", activate: "Activer",
    delete: "Supprimer", deleteConfirm: "Supprimer le code « {code} » ?",
  },
} as const;

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  valid_from: string | null;
  valid_until: string | null;
  applicable_tier_ids: string[] | null;
  is_active: boolean;
};

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function CouponRow({
  coupon,
  eventId,
  locale,
  tiers,
}: {
  coupon: Coupon;
  eventId: string;
  locale: string;
  tiers: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const cr = CR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof CR_T];

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateCoupon(coupon.id, formData);
      if (result.success) setMode("view");
      return result;
    },
    null
  );

  if (mode === "edit") {
    const displayValue =
      coupon.discount_type === "percentage"
        ? coupon.discount_value
        : (coupon.discount_value / 100).toFixed(2);
    return (
      <form
        action={formAction}
        className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
      >
        {state?.error && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="code"
            defaultValue={coupon.code}
            required
            placeholder={cr.codePh}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono uppercase"
          />
          <select
            name="discount_type"
            defaultValue={coupon.discount_type}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="percentage">{cr.percent}</option>
            <option value="fixed_amount">{cr.fixed}</option>
          </select>
          <input
            name="discount_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={displayValue}
            required
            placeholder={cr.value}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="max_uses"
            type="number"
            min="1"
            defaultValue={coupon.max_uses ?? ""}
            placeholder={cr.maxUsesPh}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="valid_from"
            type="datetime-local"
            defaultValue={toLocal(coupon.valid_from)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="valid_until"
            type="datetime-local"
            defaultValue={toLocal(coupon.valid_until)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        {tiers.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">
              {cr.appliesTo}
            </p>
            <div className="grid gap-1.5 rounded-md border border-input bg-background p-2 sm:grid-cols-2">
              {tiers.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    name="applicable_tier_ids"
                    value={t.id}
                    defaultChecked={
                      coupon.applicable_tier_ids?.includes(t.id) ?? false
                    }
                    className="accent-primary"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? cr.saving : cr.save}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md border border-input px-4 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {cr.cancel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-semibold">
            {coupon.code}
          </code>
          {!coupon.is_active && (
            <Badge variant="error">
              {cr.inactive}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% ${cr.off}`
            : `\u20AC${(coupon.discount_value / 100).toFixed(2)} ${cr.off}`}
          {" \u00B7 "}
          {coupon.times_used}
          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""} {cr.used}
          {coupon.applicable_tier_ids &&
            coupon.applicable_tier_ids.length > 0 && (
              <>
                {" \u00B7 "}
                {coupon.applicable_tier_ids.length}{" "}
                {coupon.applicable_tier_ids.length === 1 ? cr.tier : cr.tiers}{" "}
                {cr.only}
              </>
            )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          {cr.edit}
        </button>
        <form
          action={async () => {
            await toggleCouponActive(coupon.id, eventId, locale);
          }}
        >
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {coupon.is_active ? cr.deactivate : cr.activate}
          </button>
        </form>
        <form
          action={async () => {
            if (!confirm(cr.deleteConfirm.replace("{code}", coupon.code))) return;
            const r = await deleteCoupon(coupon.id, eventId, locale);
            if (r?.error) toast.error(r.error);
            else toast.success(cr.delete);
          }}
        >
          <button
            type="submit"
            className="text-xs text-red-500 hover:text-red-700"
          >
            {cr.delete}
          </button>
        </form>
      </div>
    </div>
  );
}
