"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EMPLOYMENT_TYPE_VALUES, type EmploymentType } from "@dbc/types";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { updateJobOffer } from "@/actions/job-offers";

const EMPLOYMENT_TYPE_LABEL_KEY: Record<
  EmploymentType,
  "fullTime" | "partTime" | "freelance" | "internship"
> = {
  full_time: "fullTime",
  part_time: "partTime",
  freelance: "freelance",
  internship: "internship",
};

const T = {
  en: {
    saved: "Saved",
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    descEn: "Description (EN)", descDe: "Description (DE)", descFr: "Description (FR)",
    reqEn: "Requirements (EN)", reqDe: "Requirements (DE)", reqFr: "Requirements (FR)",
    location: "Location",
    employmentType: "Employment type", selectType: "Select type",
    fullTime: "Full-time", partTime: "Part-time", freelance: "Freelance", internship: "Internship",
    department: "Department", saving: "Saving…", save: "Save",
  },
  de: {
    saved: "Gespeichert",
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    descEn: "Beschreibung (EN)", descDe: "Beschreibung (DE)", descFr: "Beschreibung (FR)",
    reqEn: "Anforderungen (EN)", reqDe: "Anforderungen (DE)", reqFr: "Anforderungen (FR)",
    location: "Ort",
    employmentType: "Beschäftigungsart", selectType: "Art auswählen",
    fullTime: "Vollzeit", partTime: "Teilzeit", freelance: "Freelance", internship: "Praktikum",
    department: "Abteilung", saving: "Wird gespeichert…", save: "Speichern",
  },
  fr: {
    saved: "Enregistré",
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

type ActionResult = { error?: string; success?: boolean } | null;

export function EditJobOfferForm({ locale, job }: { locale: string; job: Job }) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const employmentTypes = EMPLOYMENT_TYPE_VALUES.map((value) => ({
    value,
    label: t[EMPLOYMENT_TYPE_LABEL_KEY[value]],
  }));

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      return updateJobOffer(job.id, formData);
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
      toast.success(t.saved);
      router.refresh();
    }
  }, [state, router, t.saved]);

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      <FormField label={t.titleEn} required>
        <Input name="title_en" defaultValue={job.title_en} required />
      </FormField>
      <FormField label={t.titleDe}>
        <Input name="title_de" defaultValue={job.title_de} />
      </FormField>
      <FormField label={t.titleFr}>
        <Input name="title_fr" defaultValue={job.title_fr} />
      </FormField>

      <FormField label={t.descEn} required>
        <Textarea
          name="description_en"
          defaultValue={job.description_en}
          rows={8}
          required
        />
      </FormField>
      <FormField label={t.descDe}>
        <Textarea name="description_de" defaultValue={job.description_de} rows={8} />
      </FormField>
      <FormField label={t.descFr}>
        <Textarea name="description_fr" defaultValue={job.description_fr} rows={8} />
      </FormField>

      <FormField label={t.reqEn}>
        <Textarea
          name="requirements_en"
          defaultValue={job.requirements_en ?? ""}
          rows={6}
        />
      </FormField>
      <FormField label={t.reqDe}>
        <Textarea
          name="requirements_de"
          defaultValue={job.requirements_de ?? ""}
          rows={6}
        />
      </FormField>
      <FormField label={t.reqFr}>
        <Textarea
          name="requirements_fr"
          defaultValue={job.requirements_fr ?? ""}
          rows={6}
        />
      </FormField>

      <FormField label={t.location}>
        <Input name="location" defaultValue={job.location ?? ""} />
      </FormField>

      <FormField label={t.employmentType}>
        <Select
          name="employment_type"
          defaultValue={job.employment_type ?? ""}
        >
          <option value="">{t.selectType}</option>
          {employmentTypes.map((et) => (
            <option key={et.value} value={et.value}>
              {et.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={t.department}>
        <Input name="department" defaultValue={job.department ?? ""} />
      </FormField>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.saving : t.save}
      </Button>
    </form>
  );
}
