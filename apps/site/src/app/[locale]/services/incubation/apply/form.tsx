"use client";

import { useActionState } from "react";
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

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
        <div>
          <label htmlFor="founder_name" className="mb-1 block text-sm font-medium">
            {t.founderName} *
          </label>
          <input
            id="founder_name"
            name="founder_name"
            type="text"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="founder_email"
            className="mb-1 block text-sm font-medium"
          >
            {t.founderEmail} *
          </label>
          <input
            id="founder_email"
            name="founder_email"
            type="email"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="founder_phone"
            className="mb-1 block text-sm font-medium"
          >
            {t.founderPhone}
          </label>
          <input
            id="founder_phone"
            name="founder_phone"
            type="tel"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium">
            {t.country}
          </label>
          <input id="country" name="country" type="text" className={inputClass} />
        </div>
        <div>
          <label
            htmlFor="company_name"
            className="mb-1 block text-sm font-medium"
          >
            {t.companyName}
          </label>
          <input
            id="company_name"
            name="company_name"
            type="text"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="company_website"
            className="mb-1 block text-sm font-medium"
          >
            {t.companyWebsite}
          </label>
          <input
            id="company_website"
            name="company_website"
            type="url"
            placeholder="https://"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="company_stage"
            className="mb-1 block text-sm font-medium"
          >
            {t.companyStage}
          </label>
          <input
            id="company_stage"
            name="company_stage"
            type="text"
            placeholder={t.companyStageHint}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="funding_needed_eur"
            className="mb-1 block text-sm font-medium"
          >
            {t.funding}
          </label>
          <input
            id="funding_needed_eur"
            name="funding_needed_eur"
            type="number"
            min="0"
            step="100"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pitch" className="mb-1 block text-sm font-medium">
          {t.pitch} *
        </label>
        <textarea
          id="pitch"
          name="pitch"
          rows={8}
          required
          minLength={80}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || state?.success}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.sending : t.submit}
      </button>
    </form>
  );
}
