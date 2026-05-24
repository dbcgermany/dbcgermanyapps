"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Select } from "@dbc/ui";
import { createTier } from "@/actions/tiers";

const T = {
  en: {
    success: "Tier created successfully",
    nameLabel: "Tier name *",
    nameHint: "Required. Shown to buyers on the checkout page.",
    translationsTitle: "Other languages (optional)",
    nameEn: "English",
    nameDe: "German",
    nameFr: "French",
    priceLabel: "Current price (€) *",
    originalPriceLabel: "Regular price (€)",
    originalPriceHint:
      "Shown struck through on the public page. Leave empty to hide the discount.",
    maxQty: "Max quantity",
    maxQtyHint: "Leave empty for unlimited.",
    sortOrder: "Sort order",
    salesStart: "Sales start (optional)",
    salesEnd: "Sales end (optional)",
    publicTier: "Public tier",
    publicHint:
      "Visible on the public event page. Uncheck for invite-only / team / partner tiers.",
    rolesTitle: "Role & flags",
    purpose: "Purpose",
    scannerBadge: "Scanner badge label",
    scannerBadgeHint: "Shown to the door staff after scan. Empty = no badge.",
    cateringIncluded: "Catering included",
    cateringHint: "Tickets in this tier can submit catering selections.",
    countsAsSold: "Counts as sold",
    countsHint:
      "Uncheck for comp / team / companion tiers so they stay out of revenue numbers.",
    isTeam: "Team ticket",
    isTeamHint: "Scanner shows the badge in green; identifies the holder as DBC team.",
    isCompanion: "Companion ticket",
    isCompanionHint: "Holder is a +1 of a team member.",
    adding: "Adding…",
    addTier: "Add tier",
  },
  de: {
    success: "Kategorie erfolgreich erstellt",
    nameLabel: "Bezeichnung *",
    nameHint: "Erforderlich. Wird Käufern auf der Checkout-Seite gezeigt.",
    translationsTitle: "Andere Sprachen (optional)",
    nameEn: "Englisch",
    nameDe: "Deutsch",
    nameFr: "Französisch",
    priceLabel: "Aktueller Preis (€) *",
    originalPriceLabel: "Regulärer Preis (€)",
    originalPriceHint:
      "Auf der öffentlichen Seite durchgestrichen angezeigt. Leer lassen, um den Rabatt auszublenden.",
    maxQty: "Maximale Menge",
    maxQtyHint: "Leer lassen für unbegrenzt.",
    sortOrder: "Sortierung",
    salesStart: "Verkaufsstart (optional)",
    salesEnd: "Verkaufsende (optional)",
    publicTier: "Öffentliche Kategorie",
    publicHint:
      "Auf der öffentlichen Event-Seite sichtbar. Deaktivieren für Einladungs-, Team- oder Partnerkategorien.",
    rolesTitle: "Rolle & Flags",
    purpose: "Zweck",
    scannerBadge: "Scanner-Badge",
    scannerBadgeHint: "Wird dem Einlass-Team nach dem Scan gezeigt. Leer = kein Badge.",
    cateringIncluded: "Catering inklusive",
    cateringHint: "Tickets dieser Kategorie können Catering-Auswahl abgeben.",
    countsAsSold: "Zählt als verkauft",
    countsHint:
      "Deaktivieren für Comp- / Team- / Companion-Kategorien, damit sie nicht in den Umsatzzahlen erscheinen.",
    isTeam: "Team-Ticket",
    isTeamHint: "Scanner zeigt das Badge grün; identifiziert den Inhaber als DBC-Team.",
    isCompanion: "Companion-Ticket",
    isCompanionHint: "Inhaber ist eine +1 eines Teammitglieds.",
    adding: "Wird hinzugefügt…",
    addTier: "Kategorie hinzufügen",
  },
  fr: {
    success: "Catégorie créée avec succès",
    nameLabel: "Nom de la catégorie *",
    nameHint: "Obligatoire. Affiché aux acheteurs sur la page de paiement.",
    translationsTitle: "Autres langues (facultatif)",
    nameEn: "Anglais",
    nameDe: "Allemand",
    nameFr: "Français",
    priceLabel: "Prix actuel (€) *",
    originalPriceLabel: "Prix régulier (€)",
    originalPriceHint:
      "Affiché barré sur la page publique. Laisser vide pour masquer la remise.",
    maxQty: "Quantité max",
    maxQtyHint: "Laisser vide pour illimité.",
    sortOrder: "Ordre",
    salesStart: "Début des ventes (optionnel)",
    salesEnd: "Fin des ventes (optionnel)",
    publicTier: "Catégorie publique",
    publicHint:
      "Visible sur la page publique de l'événement. Décochez pour les catégories invités / équipe / partenaires.",
    rolesTitle: "Rôle & options",
    purpose: "Objet",
    scannerBadge: "Libellé du badge scanner",
    scannerBadgeHint: "Affiché au personnel d'entrée après le scan. Vide = pas de badge.",
    cateringIncluded: "Restauration incluse",
    cateringHint: "Les billets de cette catégorie peuvent soumettre une sélection de restauration.",
    countsAsSold: "Compte comme vendu",
    countsHint:
      "Décochez pour les catégories comp / équipe / accompagnant afin qu'elles ne soient pas comptabilisées dans le chiffre d'affaires.",
    isTeam: "Billet équipe",
    isTeamHint: "Le scanner affiche le badge en vert ; identifie le détenteur comme membre de l'équipe DBC.",
    isCompanion: "Billet accompagnant",
    isCompanionHint: "Le détenteur est un +1 d'un membre de l'équipe.",
    adding: "Ajout…",
    addTier: "Ajouter la catégorie",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function TierForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createTier(formData);
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

  // Active-locale name field is the primary required input at the top;
  // other two locales drop into the optional translations panel below.
  const primaryName =
    locale === "fr"
      ? { name: "name_fr", label: t.nameLabel }
      : locale === "de"
        ? { name: "name_de", label: t.nameLabel }
        : { name: "name_en", label: t.nameLabel };
  const secondaryNames =
    locale === "fr"
      ? ([
          { name: "name_en", label: t.nameEn },
          { name: "name_de", label: t.nameDe },
        ] as const)
      : locale === "de"
        ? ([
            { name: "name_en", label: t.nameEn },
            { name: "name_fr", label: t.nameFr },
          ] as const)
        : ([
            { name: "name_de", label: t.nameDe },
            { name: "name_fr", label: t.nameFr },
          ] as const);

  return (
    <form action={formAction} className="mt-4 space-y-6">
      <FormField label={primaryName.label} required hint={t.nameHint}>
        <Input name={primaryName.name} required placeholder="e.g. Early Bird" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.priceLabel} required>
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="49.00"
          />
        </FormField>
        <FormField label={t.originalPriceLabel} hint={t.originalPriceHint}>
          <Input
            name="original_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="99.00"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.maxQty} hint={t.maxQtyHint}>
          <Input name="max_quantity" type="number" min="1" placeholder="200" />
        </FormField>
        <FormField label={t.sortOrder}>
          <Input name="sort_order" type="number" defaultValue="0" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.salesStart}>
          <Input name="sales_start_at" type="datetime-local" />
        </FormField>
        <FormField label={t.salesEnd}>
          <Input name="sales_end_at" type="datetime-local" />
        </FormField>
      </div>

      <FormField label={t.publicTier} hint={t.publicHint}>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_public" value="false" />
          <input
            type="checkbox"
            name="is_public"
            value="true"
            defaultChecked
            className="accent-primary"
          />
          {t.publicTier}
        </label>
      </FormField>

      {/* Role & flags — keeps the dense layout because the labels here
          are short flags and the hints sit underneath each checkbox.
          FormField wraps the section so the spacing matches the rest. */}
      <fieldset className="rounded-md border border-border bg-muted/20 p-4 space-y-4">
        <legend className="px-1 text-xs uppercase tracking-wide text-muted-foreground">
          {t.rolesTitle}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t.purpose}>
            <Select name="purpose" defaultValue="public">
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
          <FormField label={t.scannerBadge} hint={t.scannerBadgeHint}>
            <Input
              name="scanner_badge_label"
              placeholder="VIP / TEAM (DE) / SPEAKER…"
            />
          </FormField>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckboxField
            name="catering_included"
            label={t.cateringIncluded}
            hint={t.cateringHint}
          />
          <CheckboxField
            name="counts_as_sold"
            label={t.countsAsSold}
            hint={t.countsHint}
            defaultChecked
          />
          <CheckboxField
            name="is_team"
            label={t.isTeam}
            hint={t.isTeamHint}
          />
          <CheckboxField
            name="is_companion"
            label={t.isCompanion}
            hint={t.isCompanionHint}
          />
        </div>
      </fieldset>

      <details className="rounded-md border border-border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t.translationsTitle}
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {secondaryNames.map((f) => (
            <FormField key={f.name} label={f.label}>
              <Input name={f.name} />
            </FormField>
          ))}
        </div>
      </details>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.adding : t.addTier}
      </Button>
    </form>
  );
}

/* Local checkbox helper — used 4× in this single form, doesn't ship to other
   forms. Wraps the hidden+checkbox pair the server action expects. */
function CheckboxField({
  name,
  label,
  hint,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="hidden" name={name} value="false" />
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="mt-0.5 accent-primary"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
