"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { updateTier, toggleTierPublic, deleteTier, resyncTierToStripe } from "@/actions/tiers";
import { Button, ConfirmDialog } from "@dbc/ui";
import { ActionForm } from "@/components/action-form";

const TR_T = {
  en: {
    nameEn: "Name (EN)", nameDe: "Name (DE)", nameFr: "Name (FR)",
    price: "Current price (€)",
    originalPrice: "Regular price (€) — optional",
    originalPriceHint: "Shown struck through. Leave empty to hide the discount.",
    maxQty: "Max qty (empty=∞)", sort: "Sort",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    lowStockPct: "Low-stock alert at %",
    lowStockPctHint: "Notify admins when remaining drops to this % of capacity, then again at half and a quarter.",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    hidden: "Hidden", sold: "sold", unlimited: "unlimited",
    edit: "Edit", hide: "Hide", publish: "Publish", delete: "Delete",
    deleteConfirm: 'Delete tier "{name}"?',
  },
  de: {
    nameEn: "Name (EN)", nameDe: "Name (DE)", nameFr: "Name (FR)",
    price: "Aktueller Preis (€)",
    originalPrice: "Regulärer Preis (€) — optional",
    originalPriceHint: "Wird durchgestrichen gezeigt. Leer lassen, um den Rabatt auszublenden.",
    maxQty: "Max. Menge (leer=∞)", sort: "Sort.",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    lowStockPct: "Bestandsalarm bei %",
    lowStockPctHint: "Admins werden benachrichtigt, wenn der Restbestand auf diesen % der Kapazität fällt, dann erneut bei der Hälfte und einem Viertel.",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    hidden: "Ausgeblendet", sold: "verkauft", unlimited: "unbegrenzt",
    edit: "Bearbeiten", hide: "Ausblenden", publish: "Veröffentlichen", delete: "Löschen",
    deleteConfirm: "Kategorie „{name}“ löschen?",
  },
  fr: {
    nameEn: "Nom (EN)", nameDe: "Nom (DE)", nameFr: "Nom (FR)",
    price: "Prix actuel (€)",
    originalPrice: "Prix régulier (€) — optionnel",
    originalPriceHint: "Affiché barré. Laisser vide pour masquer la remise.",
    maxQty: "Quantité max (vide=∞)", sort: "Ordre",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    lowStockPct: "Alerte stock à %",
    lowStockPctHint: "Notifier les admins quand le restant tombe à ce % de la capacité, puis à la moitié et au quart.",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    hidden: "Masqué", sold: "vendus", unlimited: "illimité",
    edit: "Modifier", hide: "Masquer", publish: "Publier", delete: "Supprimer",
    deleteConfirm: "Supprimer la catégorie « {name} » ?",
  },
} as const;

type Tier = {
  id: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  price_cents: number;
  original_price_cents: number | null;
  max_quantity: number | null;
  quantity_sold: number;
  low_stock_threshold_pct: number;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_public: boolean;
  sort_order: number;
  purpose: string | null;
  catering_included: boolean | null;
  is_team: boolean | null;
  is_companion: boolean | null;
  counts_as_sold: boolean | null;
  scanner_badge_label: string | null;
};

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function TierRow({
  tier,
  eventId,
  locale,
}: {
  tier: Tier;
  eventId: string;
  locale: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const t = TR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof TR_T];
  const tCommon = useTranslations("admin.common");

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateTier(tier.id, formData);
      if (result.success) setMode("view");
      return result;
    },
    null
  );

  if (mode === "edit") {
    return (
      <form
        action={formAction}
        className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
      >
        {state?.error && (
          <div className="rounded-md bg-danger-soft p-2 text-xs text-danger">
            {state.error}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="name_en"
            defaultValue={tier.name_en}
            placeholder={t.nameEn}
            required
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="name_de"
            defaultValue={tier.name_de ?? ""}
            placeholder={t.nameDe}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="name_fr"
            defaultValue={tier.name_fr ?? ""}
            placeholder={t.nameFr}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(tier.price_cents / 100).toFixed(2)}
              required
              placeholder={t.price}
              aria-label={t.price}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <input
              name="original_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                tier.original_price_cents != null
                  ? (tier.original_price_cents / 100).toFixed(2)
                  : ""
              }
              placeholder={t.originalPrice}
              aria-label={t.originalPrice}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {t.originalPriceHint}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="max_quantity"
            type="number"
            min="1"
            defaultValue={tier.max_quantity ?? ""}
            placeholder={t.maxQty}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <div>
            <input
              name="low_stock_threshold_pct"
              type="number"
              min="1"
              max="100"
              defaultValue={tier.low_stock_threshold_pct}
              placeholder={t.lowStockPct}
              aria-label={t.lowStockPct}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {t.lowStockPctHint}
            </p>
          </div>
          <input
            name="sort_order"
            type="number"
            defaultValue={tier.sort_order}
            placeholder={t.sort}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="sales_start_at"
            type="datetime-local"
            defaultValue={toLocal(tier.sales_start_at)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="sales_end_at"
            type="datetime-local"
            defaultValue={toLocal(tier.sales_end_at)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <textarea
            name="description_en"
            defaultValue={tier.description_en ?? ""}
            placeholder={t.descEn}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <textarea
            name="description_de"
            defaultValue={tier.description_de ?? ""}
            placeholder={t.descDe}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <textarea
            name="description_fr"
            defaultValue={tier.description_fr ?? ""}
            placeholder={t.descFr}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <fieldset className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
          <legend className="px-1 text-xs uppercase tracking-wide text-muted-foreground">
            Role & flags
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Purpose</label>
              <select
                name="purpose"
                defaultValue={tier.purpose ?? "public"}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                <option value="public">Public (paid attendee)</option>
                <option value="vip">VIP</option>
                <option value="speaker">Speaker</option>
                <option value="team_germany">Team Germany</option>
                <option value="team_external">Team International</option>
                <option value="companion">Companion (+1)</option>
                <option value="team_friend">Team friend (discounted)</option>
                <option value="press">Press</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Scanner badge label
              </label>
              <input
                name="scanner_badge_label"
                type="text"
                defaultValue={tier.scanner_badge_label ?? ""}
                placeholder="VIP / TEAM (DE) / SPEAKER…"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="catering_included" value="false" />
              <input
                type="checkbox"
                name="catering_included"
                value="true"
                defaultChecked={!!tier.catering_included}
                className="accent-primary"
              />
              Catering included
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="counts_as_sold" value="false" />
              <input
                type="checkbox"
                name="counts_as_sold"
                value="true"
                defaultChecked={tier.counts_as_sold !== false}
                className="accent-primary"
              />
              Counts as sold
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="is_team" value="false" />
              <input
                type="checkbox"
                name="is_team"
                value="true"
                defaultChecked={!!tier.is_team}
                className="accent-primary"
              />
              Team ticket
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="is_companion" value="false" />
              <input
                type="checkbox"
                name="is_companion"
                value="true"
                defaultChecked={!!tier.is_companion}
                className="accent-primary"
              />
              Companion ticket
            </label>
          </div>
        </fieldset>
        <div className="flex gap-2">
          <Button type="submit"
            disabled={isPending}>
            {isPending ? t.saving : t.save}
          </Button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md border border-input px-4 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {t.cancel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{tier.name_en}</p>
          {!tier.is_public && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {t.hidden}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            &euro;{(tier.price_cents / 100).toFixed(2)}
          </span>
          {tier.original_price_cents != null &&
            tier.original_price_cents > tier.price_cents && (
              <span className="ml-1.5 line-through">
                &euro;{(tier.original_price_cents / 100).toFixed(2)}
              </span>
            )}
          {" · "}
          {tier.quantity_sold}
          {tier.max_quantity ? ` / ${tier.max_quantity}` : ` / ${t.unlimited}`} {t.sold}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          {t.edit}
        </button>
        <ActionForm
          action={async () => toggleTierPublic(tier.id, eventId, locale)}
          successToast={tier.is_public ? tCommon("unpublishedToast") : tCommon("publishedToast")}
          errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
        >
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {tier.is_public ? t.hide : t.publish}
          </button>
        </ActionForm>
        <ActionForm
          action={async () => resyncTierToStripe(tier.id)}
          successToast={tCommon("resyncedStripeToast")}
          errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
        >
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
            title={tCommon("resyncStripe")}
          >
            {tCommon("resyncStripe")}
          </button>
        </ActionForm>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              className="text-xs text-danger hover:opacity-80"
            >
              {t.delete}
            </button>
          }
          title={t.deleteConfirm.replace("{name}", tier.name_en)}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          variant="danger"
          onConfirm={async () => {
            const res = await deleteTier(tier.id, eventId, locale);
            if (res?.error) {
              toast.error(res.error);
              return;
            }
            toast.success(t.delete);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
