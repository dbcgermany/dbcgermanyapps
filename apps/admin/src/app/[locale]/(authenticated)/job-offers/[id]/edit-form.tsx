"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EMPLOYMENT_TYPE_VALUES, type EmploymentType } from "@dbc/types";
import { updateJobOffer } from "@/actions/job-offers";

const EMPLOYMENT_TYPE_LABEL_KEY: Record<EmploymentType, "fullTime" | "partTime" | "freelance" | "internship"> = {
  full_time: "fullTime",
  part_time: "partTime",
  freelance: "freelance",
  internship: "internship",
};

const T = {
  en: {
    saved: "Saved.",
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    reqEn: "Requirements (EN)", reqDe: "Requirements (DE)", reqFr: "Requirements (FR)",
    location: "Location",
    employmentType: "Employment type", selectType: "Select type",
    fullTime: "Full-time", partTime: "Part-time", freelance: "Freelance", internship: "Internship",
    department: "Department", saving: "Saving…", save: "Save",
  },
  de: {
    saved: "Gespeichert.",
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    reqEn: "Anforderungen (EN)", reqDe: "Anforderungen (DE)", reqFr: "Anforderungen (FR)",
    location: "Ort",
    employmentType: "Beschäftigungsart", selectType: "Art auswählen",
    fullTime: "Vollzeit", partTime: "Teilzeit", freelance: "Freelance", internship: "Praktikum",
    department: "Abteilung", saving: "Wird gespeichert…", save: "Speichern",
  },
  fr: {
    saved: "Enregistré.",
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    reqEn: "Exigences (EN)", reqDe: "Exigences (DE)", reqFr: "Exigences (FR)",
    location: "Lieu",
    employmentType: "Type de contrat", selectType: "Sélectionner un type",
    fullTime: "Temps plein", partTime: "Temps partiel", freelance: "Freelance", internship: "Stage",
    department: "Département", saving: "Enregistrement…", save: "Enregistrer",
  },
} as const;

type Job = {
  id: string;
  title_en: string;
  title_de: string;
  title_fr: string;
  description_en: string;
  description_de: string;
  description_fr: string;
  requirements_en: string | null;
  requirements_de: string | null;
  requirements_fr: string | null;
  location: string | null;
  employment_type: string | null;
  department: string | null;
};

export function EditJobOfferForm({ locale, job }: { locale: string; job: Job }) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const employmentTypes = EMPLOYMENT_TYPE_VALUES.map((value) => ({
    value,
    label: t[EMPLOYMENT_TYPE_LABEL_KEY[value]],
  }));

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("locale", locale);
      return updateJobOffer(job.id, formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {t.saved}
        </div>
      )}

      <F name="title_en" label={t.titleEn} defaultValue={job.title_en} required />
      <F name="title_de" label={t.titleDe} defaultValue={job.title_de} />
      <F name="title_fr" label={t.titleFr} defaultValue={job.title_fr} />

      <F name="description_en" label={t.descEn} defaultValue={job.description_en} textarea rows={8} required />
      <F name="description_de" label={t.descDe} defaultValue={job.description_de} textarea rows={8} />
      <F name="description_fr" label={t.descFr} defaultValue={job.description_fr} textarea rows={8} />

      <F name="requirements_en" label={t.reqEn} defaultValue={job.requirements_en ?? ""} textarea rows={6} />
      <F name="requirements_de" label={t.reqDe} defaultValue={job.requirements_de ?? ""} textarea rows={6} />
      <F name="requirements_fr" label={t.reqFr} defaultValue={job.requirements_fr ?? ""} textarea rows={6} />

      <F name="location" label={t.location} defaultValue={job.location ?? ""} />

      <div>
        <label htmlFor="employment_type" className="mb-1 block text-sm font-medium">
          {t.employmentType}
        </label>
        <select
          id="employment_type"
          name="employment_type"
          defaultValue={job.employment_type ?? ""}
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

      <F name="department" label={t.department} defaultValue={job.department ?? ""} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.saving : t.save}
      </button>
    </form>
  );
}

function F({
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
