"use client";

import { use, useActionState } from "react";
import { createJobOffer } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";

const T = {
  en: {
    title: "New job offer",
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    reqEn: "Requirements (EN)", reqDe: "Requirements (DE)", reqFr: "Requirements (FR)",
    location: "Location",
    employmentType: "Employment type", selectType: "Select type",
    fullTime: "Full-time", partTime: "Part-time", freelance: "Freelance", internship: "Internship",
    department: "Department",
    saving: "Saving…", saveDraft: "Save draft",
  },
  de: {
    title: "Neue Stelle",
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    reqEn: "Anforderungen (EN)", reqDe: "Anforderungen (DE)", reqFr: "Anforderungen (FR)",
    location: "Ort",
    employmentType: "Beschäftigungsart", selectType: "Art auswählen",
    fullTime: "Vollzeit", partTime: "Teilzeit", freelance: "Freelance", internship: "Praktikum",
    department: "Abteilung",
    saving: "Wird gespeichert…", saveDraft: "Entwurf speichern",
  },
  fr: {
    title: "Nouvelle offre",
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    reqEn: "Exigences (EN)", reqDe: "Exigences (DE)", reqFr: "Exigences (FR)",
    location: "Lieu",
    employmentType: "Type de contrat", selectType: "Sélectionner un type",
    fullTime: "Temps plein", partTime: "Temps partiel", freelance: "Freelance", internship: "Stage",
    department: "Département",
    saving: "Enregistrement…", saveDraft: "Enregistrer le brouillon",
  },
} as const;

export default function NewJobOfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const employmentTypes = [
    { value: "full_time", label: t.fullTime },
    { value: "part_time", label: t.partTime },
    { value: "freelance", label: t.freelance },
    { value: "internship", label: t.internship },
  ];

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createJobOffer(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader title={t.title} />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        <Field name="title_en" label={t.titleEn} required />
        <Field name="title_de" label={t.titleDe} />
        <Field name="title_fr" label={t.titleFr} />

        <Field name="description_en" label={t.descEn} textarea rows={8} required />
        <Field name="description_de" label={t.descDe} textarea rows={8} />
        <Field name="description_fr" label={t.descFr} textarea rows={8} />

        <Field name="requirements_en" label={t.reqEn} textarea rows={6} />
        <Field name="requirements_de" label={t.reqDe} textarea rows={6} />
        <Field name="requirements_fr" label={t.reqFr} textarea rows={6} />

        <Field name="location" label={t.location} />

        <div>
          <label htmlFor="employment_type" className="mb-1 block text-sm font-medium">
            {t.employmentType}
          </label>
          <select
            id="employment_type"
            name="employment_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.selectType}</option>
            {employmentTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        <Field name="department" label={t.department} />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t.saving : t.saveDraft}
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  textarea,
  rows,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
}) {
  const className =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={rows ?? 4}
          className={className}
        />
      ) : (
        <input
          id={name}
          name={name}
          type="text"
          defaultValue={defaultValue}
          required={required}
          className={className}
        />
      )}
    </div>
  );
}
