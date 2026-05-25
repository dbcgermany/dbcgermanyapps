"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { updateSiteSettings, type SiteSettings } from "@/actions/settings";

type ActionResult = { error?: string; success?: boolean } | null;

export function SiteSettingsForm({
  locale,
  initial,
}: {
  locale: string;
  initial: SiteSettings;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => updateSiteSettings(formData),
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
      saved: "Saved",
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
      saved: "Gespeichert",
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
      saved: "Enregistré",
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

  const lastHandledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
      return;
    }
    if (state?.success) {
      toast.success(t.saved);
    }
  }, [state, t.saved]);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-border p-6 space-y-6"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.support} required>
          <Input
            name="support_email"
            type="email"
            required
            defaultValue={initial.support_email}
          />
        </FormField>
        <FormField label={t.press}>
          <Input
            name="press_email"
            type="email"
            defaultValue={initial.press_email}
          />
        </FormField>
        <FormField label={t.currency}>
          <Input
            name="default_currency"
            defaultValue={initial.default_currency}
            maxLength={3}
          />
        </FormField>
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

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <FormField label={`${t.message} (EN)`}>
            <Textarea
              name="maintenance_message_en"
              rows={3}
              defaultValue={initial.maintenance_message_en}
            />
          </FormField>
          <FormField label={`${t.message} (DE)`}>
            <Textarea
              name="maintenance_message_de"
              rows={3}
              defaultValue={initial.maintenance_message_de}
            />
          </FormField>
          <FormField label={`${t.message} (FR)`}>
            <Textarea
              name="maintenance_message_fr"
              rows={3}
              defaultValue={initial.maintenance_message_fr}
            />
          </FormField>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t.lastUpdated}: {new Date(initial.updated_at).toLocaleString(locale)}
        </p>
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.save}
        </Button>
      </div>
    </form>
  );
}
