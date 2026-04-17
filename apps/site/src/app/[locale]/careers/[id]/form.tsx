"use client";

import { useActionState } from "react";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { submitJobApplication } from "@/actions/job-apply";

type Locale = "en" | "de" | "fr";

export function JobApplicationForm({
  locale,
  jobOfferId,
}: {
  locale: Locale;
  jobOfferId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (
      prev: { success?: boolean; error?: string } | null,
      formData: FormData
    ) => {
      formData.set("locale", locale);
      formData.set("job_offer_id", jobOfferId);
      return submitJobApplication(prev, formData);
    },
    null
  );

  const t = {
    en: {
      name: "Your name",
      email: "Email",
      phone: "Phone (optional)",
      coverLetter: "Cover letter",
      linkedin: "LinkedIn URL (optional)",
      portfolio: "Portfolio URL (optional)",
      submit: "Send application",
      sending: "Sending\u2026",
      success:
        "Thanks \u2014 your application has been submitted. We\u2019ll be in touch soon.",
    },
    de: {
      name: "Ihr Name",
      email: "E-Mail",
      phone: "Telefon (optional)",
      coverLetter: "Anschreiben",
      linkedin: "LinkedIn URL (optional)",
      portfolio: "Portfolio URL (optional)",
      submit: "Bewerbung absenden",
      sending: "Wird gesendet\u2026",
      success:
        "Danke \u2014 Ihre Bewerbung wurde eingereicht. Wir melden uns in K\u00fcrze.",
    },
    fr: {
      name: "Votre nom",
      email: "E-mail",
      phone: "T\u00e9l\u00e9phone (optionnel)",
      coverLetter: "Lettre de motivation",
      linkedin: "URL LinkedIn (optionnel)",
      portfolio: "URL Portfolio (optionnel)",
      submit: "Envoyer la candidature",
      sending: "Envoi\u2026",
      success:
        "Merci \u2014 votre candidature a \u00e9t\u00e9 envoy\u00e9e. Nous reviendrons vers vous rapidement.",
    },
  }[locale];

  return (
    <form action={formAction} className="mt-6 space-y-5">
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
        <FormField label={t.name} required>
          <Input name="applicant_name" type="text" required />
        </FormField>
        <FormField label={t.email} required>
          <Input name="applicant_email" type="email" required />
        </FormField>
        <FormField label={t.phone}>
          <Input name="applicant_phone" type="tel" />
        </FormField>
        <FormField label={t.linkedin}>
          <Input name="linkedin_url" type="url" placeholder="https://" />
        </FormField>
        <FormField label={t.portfolio}>
          <Input name="portfolio_url" type="url" placeholder="https://" />
        </FormField>
      </div>

      <FormField label={t.coverLetter} required>
        <Textarea name="cover_letter" rows={8} required />
      </FormField>

      <Button type="submit" disabled={isPending || state?.success}>
        {isPending ? t.sending : t.submit}
      </Button>
    </form>
  );
}
