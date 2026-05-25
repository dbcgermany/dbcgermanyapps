"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { updateTier, toggleTierPublic, deleteTier, resyncTierToStripe } from "@/actions/tiers";
import { Badge, Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { ActionForm } from "@/components/action-form";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

const TR_T = {
  en: {
    nameEn: "Name (EN)", nameDe: "Name (DE)", nameFr: "Name (FR)",
    price: "Current price (€)",
    originalPrice: "Regular price (€) — optional",
    originalPriceHint: "Shown struck through. Leave empty to hide the discount.",
    maxQty: "Max qty (empty=∞)", sort: "Sort",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    headlineEn: "Headline (EN)", headlineDe: "Headline (DE)", headlineFr: "Headline (FR)",
    headlineHint: "Short tagline shown under the price. Empty = falls back to description.",
    perksEn: "What's included — EN (one bullet per line)",
    perksDe: "Enthalten — DE (ein Punkt pro Zeile)",
    perksFr: "Inclus — FR (un point par ligne)",
    perksHint: "Rendered as a ✓ list under the tier in the sidebar. Max 12 bullets, 240 chars each.",
    lowStockPct: "Low-stock alert at %",
    lowStockPctHint: "Notify admins when remaining drops to this % of capacity, then again at half and a quarter.",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    savedToast: "Saved",
    hidden: "Hidden", sold: "sold", unlimited: "unlimited",
    hide: "Hide", publish: "Publish", delete: "Delete",
    deleteConfirm: 'Delete tier "{name}"?',
    deletedToast: "Tier deleted",
  },
  de: {
    nameEn: "Name (EN)", nameDe: "Name (DE)", nameFr: "Name (FR)",
    price: "Aktueller Preis (€)",
    originalPrice: "Regulärer Preis (€) — optional",
    originalPriceHint: "Wird durchgestrichen gezeigt. Leer lassen, um den Rabatt auszublenden.",
    maxQty: "Max. Menge (leer=∞)", sort: "Sort.",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    headlineEn: "Slogan (EN)", headlineDe: "Slogan (DE)", headlineFr: "Slogan (FR)",
    headlineHint: "Kurzer Slogan unter dem Preis. Leer = greift auf Beschreibung zurück.",
    perksEn: "Enthalten — EN (ein Punkt pro Zeile)",
    perksDe: "Enthalten — DE (ein Punkt pro Zeile)",
    perksFr: "Enthalten — FR (ein Punkt pro Zeile)",
    perksHint: "Wird als ✓-Liste unter der Kategorie in der Sidebar gezeigt. Max. 12 Punkte, je 240 Zeichen.",
    lowStockPct: "Bestandsalarm bei %",
    lowStockPctHint: "Admins werden benachrichtigt, wenn der Restbestand auf diesen % der Kapazität fällt, dann erneut bei der Hälfte und einem Viertel.",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    savedToast: "Gespeichert",
    hidden: "Ausgeblendet", sold: "verkauft", unlimited: "unbegrenzt",
    hide: "Ausblenden", publish: "Veröffentlichen", delete: "Löschen",
    deleteConfirm: "Kategorie „{name}“ löschen?",
    deletedToast: "Kategorie gelöscht",
  },
  fr: {
    nameEn: "Nom (EN)", nameDe: "Nom (DE)", nameFr: "Nom (FR)",
    price: "Prix actuel (€)",
    originalPrice: "Prix régulier (€) — optionnel",
    originalPriceHint: "Affiché barré. Laisser vide pour masquer la remise.",
    maxQty: "Quantité max (vide=∞)", sort: "Ordre",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    headlineEn: "Slogan (EN)", headlineDe: "Slogan (DE)", headlineFr: "Slogan (FR)",
    headlineHint: "Court slogan affiché sous le prix. Vide = retour sur la description.",
    perksEn: "Inclus — EN (un point par ligne)",
    perksDe: "Inclus — DE (un point par ligne)",
    perksFr: "Inclus — FR (un point par ligne)",
    perksHint: "Affiché sous la catégorie sous forme de liste ✓. Max 12 points, 240 caractères chacun.",
    lowStockPct: "Alerte stock à %",
    lowStockPctHint: "Notifier les admins quand le restant tombe à ce % de la capacité, puis à la moitié et au quart.",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    savedToast: "Enregistré",
    hidden: "Masqué", sold: "vendus", unlimited: "illimité",
    hide: "Masquer", publish: "Publier", delete: "Supprimer",
    deleteConfirm: "Supprimer la catégorie « {name} » ?",
    deletedToast: "Catégorie supprimée",
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
  headline_en: string | null;
  headline_de: string | null;
  headline_fr: string | null;
  perks: { en?: string[]; de?: string[]; fr?: string[] } | null;
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

function perksToLines(perks: Tier["perks"], locale: "en" | "de" | "fr"): string {
  const list = perks?.[locale];
  return Array.isArray(list) ? list.join("\n") : "";
}

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function TierRow({
  tier,
  eventId,
  locale,
  dragHandle,
}: {
  tier: Tier;
  eventId: string;
  locale: string;
  dragHandle?: ReactNode;
}) {
  const t = TR_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof TR_T];
  const tCommon = useTranslations("admin.common");

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={tier.name_en}
      badges={
        <>
          {!tier.is_public && <Badge variant="default">{t.hidden}</Badge>}
        </>
      }
      meta={
        <>
          <span className="font-medium text-foreground">
            €{(tier.price_cents / 100).toFixed(2)}
          </span>
          {tier.original_price_cents != null &&
            tier.original_price_cents > tier.price_cents && (
              <span className="ml-1.5 line-through">
                €{(tier.original_price_cents / 100).toFixed(2)}
              </span>
            )}
          {" · "}
          {tier.quantity_sold}
          {tier.max_quantity ? ` / ${tier.max_quantity}` : ` / ${t.unlimited}`} {t.sold}
        </>
      }
      actions={
        <>
          <ActionForm
            action={async () => toggleTierPublic(tier.id, eventId, locale)}
            successToast={tier.is_public ? tCommon("unpublishedToast") : tCommon("publishedToast")}
            errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
          >
            <Button type="submit" variant="ghost" size="sm">
              {tier.is_public ? t.hide : t.publish}
            </Button>
          </ActionForm>
          <ActionForm
            action={async () => resyncTierToStripe(tier.id)}
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
          action={async () => deleteTier(tier.id, eventId, locale)}
          confirmTitle={t.deleteConfirm.replace("{name}", tier.name_en)}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deletedToast}
          compact
        />
      }
      renderEdit={({ close }) => (
        <TierEditForm
          tier={tier}
          eventId={eventId}
          locale={locale}
          t={t}
          onSaved={close}
        />
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */

type TierT = (typeof TR_T)[keyof typeof TR_T];
type ActionResult = { error?: string; success?: boolean } | null;

function TierEditForm({
  tier,
  eventId,
  locale,
  t,
  onSaved,
}: {
  tier: Tier;
  eventId: string;
  locale: string;
  t: TierT;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return updateTier(tier.id, formData);
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
      toast.success(t.savedToast);
      onSaved();
    }
  }, [state, t.savedToast, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.nameEn} required>
          <Input name="name_en" defaultValue={tier.name_en} required />
        </FormField>
        <FormField label={t.nameDe}>
          <Input name="name_de" defaultValue={tier.name_de ?? ""} />
        </FormField>
        <FormField label={t.nameFr}>
          <Input name="name_fr" defaultValue={tier.name_fr ?? ""} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.price} required>
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(tier.price_cents / 100).toFixed(2)}
            required
          />
        </FormField>
        <FormField label={t.originalPrice} hint={t.originalPriceHint}>
          <Input
            name="original_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              tier.original_price_cents != null
                ? (tier.original_price_cents / 100).toFixed(2)
                : ""
            }
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.maxQty}>
          <Input
            name="max_quantity"
            type="number"
            min="1"
            defaultValue={tier.max_quantity ?? ""}
          />
        </FormField>
        <FormField label={t.lowStockPct} hint={t.lowStockPctHint}>
          <Input
            name="low_stock_threshold_pct"
            type="number"
            min="1"
            max="100"
            defaultValue={tier.low_stock_threshold_pct}
          />
        </FormField>
        <FormField label={t.sort}>
          <Input name="sort_order" type="number" defaultValue={tier.sort_order} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sales start">
          <Input
            name="sales_start_at"
            type="datetime-local"
            defaultValue={toLocal(tier.sales_start_at)}
          />
        </FormField>
        <FormField label="Sales end">
          <Input
            name="sales_end_at"
            type="datetime-local"
            defaultValue={toLocal(tier.sales_end_at)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.descEn}>
          <Textarea
            name="description_en"
            defaultValue={tier.description_en ?? ""}
            rows={2}
          />
        </FormField>
        <FormField label={t.descDe}>
          <Textarea
            name="description_de"
            defaultValue={tier.description_de ?? ""}
            rows={2}
          />
        </FormField>
        <FormField label={t.descFr}>
          <Textarea
            name="description_fr"
            defaultValue={tier.description_fr ?? ""}
            rows={2}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.headlineEn}>
          <Input
            name="headline_en"
            defaultValue={tier.headline_en ?? ""}
            maxLength={160}
          />
        </FormField>
        <FormField label={t.headlineDe}>
          <Input
            name="headline_de"
            defaultValue={tier.headline_de ?? ""}
            maxLength={160}
          />
        </FormField>
        <FormField label={t.headlineFr}>
          <Input
            name="headline_fr"
            defaultValue={tier.headline_fr ?? ""}
            maxLength={160}
          />
        </FormField>
      </div>
      <p className="-mt-2 text-[11px] text-muted-foreground">{t.headlineHint}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t.perksEn}>
          <Textarea
            name="perks_en"
            defaultValue={perksToLines(tier.perks, "en")}
            rows={5}
            className="font-mono"
          />
        </FormField>
        <FormField label={t.perksDe}>
          <Textarea
            name="perks_de"
            defaultValue={perksToLines(tier.perks, "de")}
            rows={5}
            className="font-mono"
          />
        </FormField>
        <FormField label={t.perksFr}>
          <Textarea
            name="perks_fr"
            defaultValue={perksToLines(tier.perks, "fr")}
            rows={5}
            className="font-mono"
          />
        </FormField>
      </div>
      <p className="-mt-2 text-[11px] text-muted-foreground">{t.perksHint}</p>

      <fieldset className="rounded-md border border-border bg-muted/20 p-4 space-y-4">
        <legend className="px-1 text-xs uppercase tracking-wide text-muted-foreground">
          Role & flags
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Purpose">
            <Select name="purpose" defaultValue={tier.purpose ?? "public"}>
              <option value="public">Public (paid attendee)</option>
              <option value="vip">VIP</option>
              <option value="speaker">Speaker</option>
              <option value="team_germany">Team Germany</option>
              <option value="team_external">Team International</option>
              <option value="companion">Companion (+1)</option>
              <option value="team_friend">Team friend (discounted)</option>
              <option value="press">Press</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
          <FormField label="Scanner badge label">
            <Input
              name="scanner_badge_label"
              defaultValue={tier.scanner_badge_label ?? ""}
              placeholder="VIP / TEAM (DE) / SPEAKER…"
            />
          </FormField>
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
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onSaved}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
