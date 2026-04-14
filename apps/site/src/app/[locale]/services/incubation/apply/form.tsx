"use client";

import { useActionState } from "react";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { submitIncubationApplication } from "@/actions/incubation";

type Locale = "en" | "de" | "fr";

export function IncubationForm({ locale }: { locale: Locale }) {
  const [state, formAction, isPending] = useActionState(
    async (
      prev: { success?: boolean; error?: string } | null,
      formData: FormData
    ) => {
      formData.set("locale", locale);
      return submitIncubationApplication(prev, formData);
    },
    null
  );

  const t = {
    en: {
      founderName: "Your name",
      founderEmail: "Email",
      founderPhone: "Phone (optional)",
      companyName: "Company / project name",
      companyStage: "Stage",
      companyStageHint: "idea · MVP · revenue · scaling",
      companyWebsite: "Website (optional)",
      country: "Country",
      pitch:
        "In 2 to 4 paragraphs, describe your project, your users, and what you need from DBC.",
      funding: "Funding sought (€, optional)",
      submit: "Send application",
      sending: "Sending…",
      success:
        "Thanks — your application is in. We'll be in touch within 10 business days.",
    },
    de: {
      founderName: "Ihr Name",
      founderEmail: "E-Mail",
      founderPhone: "Telefon (optional)",
      companyName: "Firma / Projektname",
      companyStage: "Phase",
      companyStageHint: "Idee · MVP · Umsatz · Skalierung",
      companyWebsite: "Webseite (optional)",
      country: "Land",
      pitch:
        "Beschreibe in 2 bis 4 Absätzen dein Projekt, deine Nutzer:innen und was du von DBC brauchst.",
      funding: "Gesuchte Finanzierung (€, optional)",
      submit: "Bewerbung absenden",
      sending: "Wird gesendet…",
      success:
        "Danke — deine Bewerbung ist bei uns. Wir melden uns innerhalb von 10 Werktagen.",
    },
    fr: {
      founderName: "Votre nom",
      founderEmail: "E-mail",
      founderPhone: "Téléphone (optionnel)",
      companyName: "Société / nom du projet",
      companyStage: "Stade",
      companyStageHint: "idée · MVP · revenus · scale",
      companyWebsite: "Site web (optionnel)",
      country: "Pays",
      pitch:
        "En 2 à 4 paragraphes, décrivez votre projet, vos utilisateurs et ce que vous attendez de DBC.",
      funding: "Financement recherché (€, optionnel)",
      submit: "Envoyer la candidature",
      sending: "Envoi…",
      success:
        "Merci — votre candidature est enregistrée. Retour sous 10 jours ouvrés.",
    },
  }[locale];

  return (
    <form action={formAction} className="mt-10 space-y-5">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {t.success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.founderName} required>
          <Input name="founder_name" type="text" required />
        </FormField>
        <FormField label={t.founderEmail} required>
          <Input name="founder_email" type="email" required />
        </FormField>
        <FormField label={t.founderPhone}>
          <Input name="founder_phone" type="tel" />
        </FormField>
        <FormField label={t.country}>
          <Input name="country" type="text" />
        </FormField>
        <FormField label={t.companyName}>
          <Input name="company_name" type="text" />
        </FormField>
        <FormField label={t.companyWebsite}>
          <Input name="company_website" type="url" placeholder="https://" />
        </FormField>
        <FormField label={t.companyStage} hint={t.companyStageHint}>
          <Input name="company_stage" type="text" />
        </FormField>
        <FormField label={t.funding}>
          <Input name="funding_needed_eur" type="number" min="0" step="100" />
        </FormField>
      </div>

      <FormField label={t.pitch} required>
        <Textarea name="pitch" rows={8} required minLength={80} />
      </FormField>

      <Button type="submit" disabled={isPending || state?.success}>
        {isPending ? t.sending : t.submit}
      </Button>
    </form>
  );
}
