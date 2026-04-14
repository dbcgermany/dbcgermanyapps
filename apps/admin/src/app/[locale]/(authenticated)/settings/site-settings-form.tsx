"use client";

import { useActionState } from "react";
import { updateSiteSettings, type SiteSettings } from "@/actions/settings";

export function SiteSettingsForm({
  locale,
  initial,
}: {
  locale: string;
  initial: SiteSettings;
}) {
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => updateSiteSettings(formData),
    null
  );

  const t = {
    en: {
      title: "Runtime site settings",
      subtitle:
        "Editable configuration consumed by admin + public site. Changes apply immediately.",
      support: "Support email",
      press: "Press email",
      maintenance: "Maintenance mode",
      maintenanceHint:
        "When on, the public site serves a maintenance screen instead of content.",
      message: "Maintenance message",
      currency: "Default currency",
      save: "Save settings",
      saving: "Saving…",
      saved: "Saved.",
      lastUpdated: "Last updated",
    },
    de: {
      title: "Laufzeit-Einstellungen",
      subtitle:
        "Editierbare Konfiguration für Admin + öffentliche Seite. Änderungen wirken sofort.",
      support: "Support-E-Mail",
      press: "Presse-E-Mail",
      maintenance: "Wartungsmodus",
      maintenanceHint:
        "Wenn aktiv, zeigt die öffentliche Seite eine Wartungsmeldung statt Inhalten an.",
      message: "Wartungsmeldung",
      currency: "Standardwährung",
      save: "Speichern",
      saving: "Speichert…",
      saved: "Gespeichert.",
      lastUpdated: "Zuletzt aktualisiert",
    },
    fr: {
      title: "Paramètres de site",
      subtitle:
        "Configuration modifiable, utilisée par l'admin et le site public. Prise en compte immédiate.",
      support: "E-mail support",
      press: "E-mail presse",
      maintenance: "Mode maintenance",
      maintenanceHint:
        "Activé, le site public affiche un message de maintenance.",
      message: "Message maintenance",
      currency: "Devise par défaut",
      save: "Enregistrer",
      saving: "Enregistrement…",
      saved: "Enregistré.",
      lastUpdated: "Dernière mise à jour",
    },
  }[locale as "en" | "de" | "fr"] ?? {
    title: "Site settings",
    subtitle: "",
    support: "Support email",
    press: "Press email",
    maintenance: "Maintenance mode",
    maintenanceHint: "",
    message: "Maintenance message",
    currency: "Currency",
    save: "Save",
    saving: "...",
    saved: "Saved",
    lastUpdated: "Last updated",
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form
      action={formAction}
      className="rounded-lg border border-border p-6 space-y-5"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {t.saved}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.support}</span>
          <input
            name="support_email"
            type="email"
            required
            defaultValue={initial.support_email}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.press}</span>
          <input
            name="press_email"
            type="email"
            defaultValue={initial.press_email}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.currency}</span>
          <input
            name="default_currency"
            type="text"
            defaultValue={initial.default_currency}
            maxLength={3}
            className={inputClass}
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <label className="flex items-start gap-3">
          <input
            name="maintenance_mode"
            type="checkbox"
            defaultChecked={initial.maintenance_mode}
            className="mt-1 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium">{t.maintenance}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t.maintenanceHint}
            </span>
          </span>
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs text-muted-foreground">
              {t.message} (EN)
            </span>
            <textarea
              name="maintenance_message_en"
              rows={3}
              defaultValue={initial.maintenance_message_en}
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-muted-foreground">
              {t.message} (DE)
            </span>
            <textarea
              name="maintenance_message_de"
              rows={3}
              defaultValue={initial.maintenance_message_de}
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-muted-foreground">
              {t.message} (FR)
            </span>
            <textarea
              name="maintenance_message_fr"
              rows={3}
              defaultValue={initial.maintenance_message_fr}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t.lastUpdated}: {new Date(initial.updated_at).toLocaleString(locale)}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
