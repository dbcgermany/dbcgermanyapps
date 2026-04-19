"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@dbc/ui";
import {
  createDashboardAd,
  updateDashboardAd,
  toggleDashboardAdActive,
  deleteDashboardAd,
  type DashboardAd,
} from "@/actions/dashboard-ads";
import { DashboardAdCarousel } from "@/components/dashboard-ad-carousel";

const T = {
  en: {
    preview: "Live preview",
    previewHint:
      "This is exactly what staff will see on the dashboard. Only active, in-window ads appear here.",
    newAd: "New ad",
    editAd: "Edit ad",
    allAds: "All ads",
    noAds: "No ads yet. Create the first one below.",
    createFirst: "Create first ad",
    titleRequired: "Title (EN)",
    titleDe: "Title (DE)",
    titleFr: "Title (FR)",
    subtitleEn: "Subtitle (EN)",
    subtitleDe: "Subtitle (DE)",
    subtitleFr: "Subtitle (FR)",
    ctaEn: "CTA label (EN)",
    ctaDe: "CTA label (DE)",
    ctaFr: "CTA label (FR)",
    ctaUrl: "CTA URL (clicked button target)",
    imageUrl: "Image URL — the ad background image",
    imageHint:
      "Paste a fully qualified URL (https://…). Landscape / banner ratio works best (≈ 1600 × 400 px).",
    accent: "Accent color (optional hex, e.g. #b81838)",
    sortOrder: "Sort order (lower shows first)",
    startsAt: "Starts at (optional)",
    endsAt: "Ends at (optional)",
    active: "Active",
    save: "Save",
    saving: "Saving…",
    create: "Create ad",
    creating: "Creating…",
    cancel: "Cancel",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    deleteConfirm: "Delete this ad permanently?",
    saved: "Saved.",
    created: "Ad created.",
    deleted: "Ad deleted.",
  },
  de: {
    preview: "Live-Vorschau",
    previewHint:
      "So sehen Mitarbeiter:innen die Anzeige im Dashboard. Nur aktive, laufende Anzeigen erscheinen hier.",
    newAd: "Neue Anzeige",
    editAd: "Anzeige bearbeiten",
    allAds: "Alle Anzeigen",
    noAds: "Noch keine Anzeigen. Erstellen Sie unten die erste.",
    createFirst: "Erste Anzeige erstellen",
    titleRequired: "Titel (EN)",
    titleDe: "Titel (DE)",
    titleFr: "Titel (FR)",
    subtitleEn: "Untertitel (EN)",
    subtitleDe: "Untertitel (DE)",
    subtitleFr: "Untertitel (FR)",
    ctaEn: "CTA-Label (EN)",
    ctaDe: "CTA-Label (DE)",
    ctaFr: "CTA-Label (FR)",
    ctaUrl: "CTA-URL (Ziel beim Klick)",
    imageUrl: "Bild-URL — Hintergrundbild der Anzeige",
    imageHint:
      "Vollständige URL einfügen (https://…). Querformat / Bannerverhältnis bevorzugt (~1600 × 400 px).",
    accent: "Akzentfarbe (optional Hex, z. B. #b81838)",
    sortOrder: "Sortierung (niedriger zuerst)",
    startsAt: "Startzeit (optional)",
    endsAt: "Endzeit (optional)",
    active: "Aktiv",
    save: "Speichern",
    saving: "Wird gespeichert…",
    create: "Anzeige erstellen",
    creating: "Wird erstellt…",
    cancel: "Abbrechen",
    edit: "Bearbeiten",
    activate: "Aktivieren",
    deactivate: "Deaktivieren",
    delete: "Löschen",
    deleteConfirm: "Diese Anzeige endgültig löschen?",
    saved: "Gespeichert.",
    created: "Anzeige erstellt.",
    deleted: "Anzeige gelöscht.",
  },
  fr: {
    preview: "Aperçu en direct",
    previewHint:
      "Ce que verront les équipes sur le tableau de bord. Seules les annonces actives et en cours s’affichent ici.",
    newAd: "Nouvelle annonce",
    editAd: "Modifier l’annonce",
    allAds: "Toutes les annonces",
    noAds: "Aucune annonce. Créez la première ci-dessous.",
    createFirst: "Créer la première annonce",
    titleRequired: "Titre (EN)",
    titleDe: "Titre (DE)",
    titleFr: "Titre (FR)",
    subtitleEn: "Sous-titre (EN)",
    subtitleDe: "Sous-titre (DE)",
    subtitleFr: "Sous-titre (FR)",
    ctaEn: "Libellé CTA (EN)",
    ctaDe: "Libellé CTA (DE)",
    ctaFr: "Libellé CTA (FR)",
    ctaUrl: "URL CTA (cible du bouton)",
    imageUrl: "URL de l’image — fond de l’annonce",
    imageHint:
      "Collez une URL complète (https://…). Format bannière / paysage recommandé (~1600 × 400 px).",
    accent: "Couleur d’accent (hex optionnel, ex. #b81838)",
    sortOrder: "Ordre (le plus bas en premier)",
    startsAt: "Début (optionnel)",
    endsAt: "Fin (optionnelle)",
    active: "Actif",
    save: "Enregistrer",
    saving: "Enregistrement…",
    create: "Créer l’annonce",
    creating: "Création…",
    cancel: "Annuler",
    edit: "Modifier",
    activate: "Activer",
    deactivate: "Désactiver",
    delete: "Supprimer",
    deleteConfirm: "Supprimer définitivement cette annonce ?",
    saved: "Enregistré.",
    created: "Annonce créée.",
    deleted: "Annonce supprimée.",
  },
} as const;

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function AdsClient({
  locale,
  initialAds,
}: {
  locale: string;
  initialAds: DashboardAd[];
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewAds = initialAds.filter((a) => a.is_active);

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleDashboardAdActive(id);
      if ("error" in res) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(t.deleteConfirm + "\n\n" + title)) return;
    startTransition(async () => {
      const res = await deleteDashboardAd(id);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success(t.deleted);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-8 space-y-10">
      {/* Live preview */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t.preview}
          </h2>
        </div>
        {previewAds.length > 0 ? (
          <DashboardAdCarousel ads={previewAds} locale={locale} />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.previewHint}
          </p>
        )}
      </section>

      {/* Create form (collapsed by default) */}
      <section>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + {t.newAd}
          </button>
        ) : (
          <AdForm
            mode="create"
            t={t}
            isPending={isPending}
            onCancel={() => setCreating(false)}
            onSubmit={(formData) =>
              startTransition(async () => {
                const res = await createDashboardAd(formData);
                if ("error" in res && res.error) {
                  toast.error(res.error);
                  return;
                }
                toast.success(t.created);
                setCreating(false);
                router.refresh();
              })
            }
          />
        )}
      </section>

      {/* List */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t.allAds}
        </h2>
        {initialAds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t.noAds}
          </p>
        ) : (
          <ul className="space-y-3">
            {initialAds.map((ad) =>
              editingId === ad.id ? (
                <li key={ad.id}>
                  <AdForm
                    mode="edit"
                    initial={ad}
                    t={t}
                    isPending={isPending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(formData) =>
                      startTransition(async () => {
                        const res = await updateDashboardAd(ad.id, formData);
                        if ("error" in res && res.error) {
                          toast.error(res.error);
                          return;
                        }
                        toast.success(t.saved);
                        setEditingId(null);
                        router.refresh();
                      })
                    }
                  />
                </li>
              ) : (
                <li
                  key={ad.id}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div
                    className="h-12 w-20 shrink-0 rounded-md bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${ad.image_url})` }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{ad.title_en}</p>
                      <Badge variant={ad.is_active ? "success" : "default"}>
                        {ad.is_active ? t.active : "—"}
                      </Badge>
                    </div>
                    {ad.subtitle_en && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {ad.subtitle_en}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {ad.sort_order}
                      {ad.starts_at && ` · ${new Date(ad.starts_at).toLocaleDateString(locale)}+`}
                      {ad.ends_at && ` → ${new Date(ad.ends_at).toLocaleDateString(locale)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingId(ad.id)}
                      className="rounded-md px-2 py-1 font-semibold text-primary hover:bg-primary/10"
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(ad.id)}
                      disabled={isPending}
                      className="rounded-md px-2 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {ad.is_active ? t.deactivate : t.activate}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ad.id, ad.title_en)}
                      disabled={isPending}
                      className="rounded-md px-2 py-1 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                    >
                      {t.delete}
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form — create + edit share the same fields
// ---------------------------------------------------------------------------
type FormT = (typeof T)[keyof typeof T];

function AdForm({
  mode,
  initial,
  t,
  isPending,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: DashboardAd;
  t: FormT;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <Field
        label={t.imageUrl}
        hint={t.imageHint}
        name="image_url"
        type="url"
        required
        defaultValue={initial?.image_url ?? ""}
        placeholder="https://images.example.com/banner.webp"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.titleRequired} name="title_en" required defaultValue={initial?.title_en ?? ""} />
        <Field label={t.titleDe} name="title_de" defaultValue={initial?.title_de ?? ""} />
        <Field label={t.titleFr} name="title_fr" defaultValue={initial?.title_fr ?? ""} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.subtitleEn} name="subtitle_en" defaultValue={initial?.subtitle_en ?? ""} textarea rows={2} />
        <Field label={t.subtitleDe} name="subtitle_de" defaultValue={initial?.subtitle_de ?? ""} textarea rows={2} />
        <Field label={t.subtitleFr} name="subtitle_fr" defaultValue={initial?.subtitle_fr ?? ""} textarea rows={2} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.ctaEn} name="cta_label_en" defaultValue={initial?.cta_label_en ?? ""} />
        <Field label={t.ctaDe} name="cta_label_de" defaultValue={initial?.cta_label_de ?? ""} />
        <Field label={t.ctaFr} name="cta_label_fr" defaultValue={initial?.cta_label_fr ?? ""} />
      </div>

      <Field
        label={t.ctaUrl}
        name="cta_url"
        type="url"
        defaultValue={initial?.cta_url ?? ""}
        placeholder="https://…"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label={t.accent}
          name="accent_color"
          defaultValue={initial?.accent_color ?? ""}
          placeholder="#b81838"
        />
        <Field
          label={t.sortOrder}
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order?.toString() ?? "0"}
        />
        <label className="flex items-end gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="h-4 w-4 accent-primary"
          />
          {t.active}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t.startsAt}
          name="starts_at"
          type="datetime-local"
          defaultValue={toDatetimeLocal(initial?.starts_at ?? null)}
        />
        <Field
          label={t.endsAt}
          name="ends_at"
          type="datetime-local"
          defaultValue={toDatetimeLocal(initial?.ends_at ?? null)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending
            ? mode === "create"
              ? t.creating
              : t.saving
            : mode === "create"
              ? t.create
              : t.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
  required,
  placeholder,
  hint,
  textarea,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={rows ?? 3}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type ?? "text"}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
