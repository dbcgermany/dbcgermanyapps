"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BirthdayField,
  Button,
  CountrySelect,
  FormField,
  Input,
  NameFields,
  TITLE_VALUES,
  Textarea,
  TitleGenderFields,
  type Gender,
  type Title,
} from "@dbc/ui";
import { submitJobApplication } from "@/actions/job-apply";

type Locale = "en" | "de" | "fr";

export function JobApplicationForm({
  locale,
  jobOfferId,
}: {
  locale: Locale;
  jobOfferId: string;
}) {
  const tPerson = useTranslations("person");
  const [title, setTitle] = useState<Title | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");

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

  const titleLabels = Object.fromEntries(
    TITLE_VALUES.map((v) => [
      v,
      tPerson(
        `title${v.charAt(0).toUpperCase() + v.slice(1)}` as
          | "titleMr"
          | "titleMs"
          | "titleMrs"
          | "titleMx"
          | "titleDr"
          | "titleProf"
          | "titleExcellency"
          | "titleHonourable"
          | "titleRev"
      ),
    ])
  ) as Record<Title, string>;
  const genderLabels: Record<Gender, string> = {
    female: tPerson("genderFemale"),
    male: tPerson("genderMale"),
    non_binary: tPerson("genderNonBinary"),
    prefer_not_to_say: tPerson("genderPreferNotToSay"),
  };

  const t = {
    en: {
      email: "Email",
      phone: "Phone (optional)",
      coverLetter: "Cover letter",
      resume: "Resume link (optional)",
      resumePlaceholder: "Google Drive, Dropbox, etc.",
      linkedin: "LinkedIn URL (optional)",
      portfolio: "Portfolio URL (optional)",
      submit: "Send application",
      sending: "Sending\u2026",
      success:
        "Thanks \u2014 your application has been submitted. We\u2019ll be in touch soon.",
    },
    de: {
      email: "E-Mail",
      phone: "Telefon (optional)",
      coverLetter: "Anschreiben",
      resume: "Lebenslauf-Link (optional)",
      resumePlaceholder: "Google Drive, Dropbox, etc.",
      linkedin: "LinkedIn URL (optional)",
      portfolio: "Portfolio URL (optional)",
      submit: "Bewerbung absenden",
      sending: "Wird gesendet\u2026",
      success:
        "Danke \u2014 Ihre Bewerbung wurde eingereicht. Wir melden uns in K\u00fcrze.",
    },
    fr: {
      email: "E-mail",
      phone: "T\u00e9l\u00e9phone (optionnel)",
      coverLetter: "Lettre de motivation",
      resume: "Lien CV (optionnel)",
      resumePlaceholder: "Google Drive, Dropbox, etc.",
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

      <NameFields
        firstNameName="applicant_first_name"
        lastNameName="applicant_last_name"
        firstNameLabel={tPerson("firstName")}
        lastNameLabel={tPerson("lastName")}
        required
      />

      <TitleGenderFields
        title={title}
        gender={gender}
        onTitleChange={setTitle}
        onGenderChange={setGender}
        titleLabel={tPerson("title")}
        genderLabel={tPerson("gender")}
        titleOptionLabels={titleLabels}
        genderOptionLabels={genderLabels}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.email} required>
          <Input name="applicant_email" type="email" required autoComplete="email" />
        </FormField>
        <FormField label={t.phone}>
          <Input name="applicant_phone" type="tel" autoComplete="tel" />
        </FormField>
        <BirthdayField
          value={birthday}
          onChange={(iso) => setBirthday(iso ?? "")}
          label={tPerson("birthday")}
        />
        <div>
          <label className="mb-1 block text-sm font-medium">
            {tPerson("country")}
          </label>
          <CountrySelect
            locale={locale}
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <FormField label={t.resume}>
          <Input
            name="resume_url"
            type="url"
            placeholder={t.resumePlaceholder}
          />
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
