"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge, Button, FormField, Input, Select } from "@dbc/ui";
import {
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
  resyncCouponToStripe,
} from "@/actions/coupons";
import { ActionForm } from "@/components/action-form";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

const CR_T = {
  en: {
    percent: "Percentage (%)", fixed: "Fixed (€)",
    codePh: "CODE", value: "Value", maxUsesPh: "Max uses (empty=∞)",
    appliesTo: "Applies to tiers (empty = all)",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    savedToast: "Saved",
    inactive: "Inactive",
    off: "off", used: "used", tier: "tier", tiers: "tiers", only: "only",
    deactivate: "Deactivate", activate: "Activate",
    delete: "Delete", deleteConfirm: 'Delete coupon "{code}"?',
    deletedToast: "Coupon deleted",
  },
  de: {
    percent: "Prozentual (%)", fixed: "Festbetrag (€)",
    codePh: "CODE", value: "Wert", maxUsesPh: "Max. Nutzungen (leer=∞)",
    appliesTo: "Gilt für Kategorien (leer = alle)",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    savedToast: "Gespeichert",
    inactive: "Inaktiv",
    off: "Rabatt", used: "genutzt", tier: "Kategorie", tiers: "Kategorien", only: "nur",
    deactivate: "Deaktivieren", activate: "Aktivieren",
    delete: "Löschen", deleteConfirm: "Code „{code}“ löschen?",
    deletedToast: "Coupon gelöscht",
  },
  fr: {
    percent: "Pourcentage (%)", fixed: "Fixe (€)",
    codePh: "CODE", value: "Valeur", maxUsesPh: "Nb max (vide=∞)",
    appliesTo: "S’applique aux catégories (vide = toutes)",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    savedToast: "Enregistré",
    inactive: "Inactif",
    off: "de remise", used: "utilisé(s)", tier: "catégorie", tiers: "catégories", only: "uniquement",
    deactivate: "Désactiver", activate: "Activer",
    delete: "Supprimer", deleteConfirm: "Supprimer le code « {code} » ?",
    deletedToast: "Coupon supprimé",
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
  const cr = CR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof CR_T];
  const tCommon = useTranslations("admin.common");

  return (
    <InlineEditRow
      title={
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm font-semibold">
          {coupon.code}
        </code>
      }
      badges={!coupon.is_active && <Badge variant="error">{cr.inactive}</Badge>}
      meta={
        <>
          {coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% ${cr.off}`
            : `€${(coupon.discount_value / 100).toFixed(2)} ${cr.off}`}
          {" · "}
          {coupon.times_used}
          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""} {cr.used}
          {coupon.applicable_tier_ids &&
            coupon.applicable_tier_ids.length > 0 && (
              <>
                {" · "}
                {coupon.applicable_tier_ids.length}{" "}
                {coupon.applicable_tier_ids.length === 1 ? cr.tier : cr.tiers}{" "}
                {cr.only}
              </>
            )}
        </>
      }
      actions={
        <>
          <ActionForm
            action={async () => toggleCouponActive(coupon.id, eventId, locale)}
            successToast={coupon.is_active ? tCommon("unpublishedToast") : tCommon("publishedToast")}
            errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
          >
            <Button type="submit" variant="ghost" size="sm">
              {coupon.is_active ? cr.deactivate : cr.activate}
            </Button>
          </ActionForm>
          <ActionForm
            action={async () => resyncCouponToStripe(coupon.id)}
            successToast={tCommon("resyncedStripeToast")}
            errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              title={tCommon("resyncStripe")}
            >
              {tCommon("resyncStripe")}
            </Button>
          </ActionForm>
        </>
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteCoupon(coupon.id, eventId, locale)}
          confirmTitle={cr.delete}
          confirmDescription={cr.deleteConfirm.replace("{code}", coupon.code)}
          confirmLabel={cr.delete}
          cancelLabel={cr.cancel}
          label={cr.delete}
          successToast={cr.deletedToast}
          compact
        />
      }
      renderEdit={({ close }) => (
        <CouponEditForm
          coupon={coupon}
          eventId={eventId}
          locale={locale}
          tiers={tiers}
          cr={cr}
          onSaved={close}
        />
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */

type CouponT = (typeof CR_T)[keyof typeof CR_T];
type ActionResult = { error?: string; success?: boolean } | null;

function CouponEditForm({
  coupon,
  eventId,
  locale,
  tiers,
  cr,
  onSaved,
}: {
  coupon: Coupon;
  eventId: string;
  locale: string;
  tiers: { id: string; name: string }[];
  cr: CouponT;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return updateCoupon(coupon.id, formData);
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
      toast.success(cr.savedToast);
      onSaved();
    }
  }, [state, cr.savedToast, onSaved]);

  const displayValue =
    coupon.discount_type === "percentage"
      ? coupon.discount_value
      : (coupon.discount_value / 100).toFixed(2);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Code" required>
          <Input
            name="code"
            defaultValue={coupon.code}
            required
            placeholder={cr.codePh}
            className="font-mono uppercase"
          />
        </FormField>
        <FormField label="Type">
          <Select name="discount_type" defaultValue={coupon.discount_type}>
            <option value="percentage">{cr.percent}</option>
            <option value="fixed_amount">{cr.fixed}</option>
          </Select>
        </FormField>
        <FormField label={cr.value} required>
          <Input
            name="discount_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={displayValue}
            required
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={cr.maxUsesPh}>
          <Input
            name="max_uses"
            type="number"
            min="1"
            defaultValue={coupon.max_uses ?? ""}
          />
        </FormField>
        <FormField label="Valid from">
          <Input
            name="valid_from"
            type="datetime-local"
            defaultValue={toLocal(coupon.valid_from)}
          />
        </FormField>
        <FormField label="Valid until">
          <Input
            name="valid_until"
            type="datetime-local"
            defaultValue={toLocal(coupon.valid_until)}
          />
        </FormField>
      </div>
      {tiers.length > 0 && (
        <FormField label={cr.appliesTo}>
          <div className="grid gap-1.5 rounded-md border border-input bg-background p-2 sm:grid-cols-2">
            {tiers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-xs"
              >
                <Input
                  type="checkbox"
                  name="applicable_tier_ids"
                  value={t.id}
                  defaultChecked={
                    coupon.applicable_tier_ids?.includes(t.id) ?? false
                  }
                />
                {t.name}
              </label>
            ))}
          </div>
        </FormField>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? cr.saving : cr.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onSaved}>
          {cr.cancel}
        </Button>
      </div>
    </form>
  );
}
