"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateJobOffer } from "@/actions/job-offers";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

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
          Saved.
        </div>
      )}

      <F name="title_en" label="Title (EN)" defaultValue={job.title_en} required />
      <F name="title_de" label="Title (DE)" defaultValue={job.title_de} />
      <F name="title_fr" label="Title (FR)" defaultValue={job.title_fr} />

      <F
        name="description_en"
        label="Description (EN)"
        defaultValue={job.description_en}
        textarea
        rows={8}
        required
      />
      <F
        name="description_de"
        label="Description (DE)"
        defaultValue={job.description_de}
        textarea
        rows={8}
      />
      <F
        name="description_fr"
        label="Description (FR)"
        defaultValue={job.description_fr}
        textarea
        rows={8}
      />

      <F
        name="requirements_en"
        label="Requirements (EN)"
        defaultValue={job.requirements_en ?? ""}
        textarea
        rows={6}
      />
      <F
        name="requirements_de"
        label="Requirements (DE)"
        defaultValue={job.requirements_de ?? ""}
        textarea
        rows={6}
      />
      <F
        name="requirements_fr"
        label="Requirements (FR)"
        defaultValue={job.requirements_fr ?? ""}
        textarea
        rows={6}
      />

      <F name="location" label="Location" defaultValue={job.location ?? ""} />

      <div>
        <label htmlFor="employment_type" className="mb-1 block text-sm font-medium">
          Employment type
        </label>
        <select
          id="employment_type"
          name="employment_type"
          defaultValue={job.employment_type ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select type</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <F name="department" label="Department" defaultValue={job.department ?? ""} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save"}
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
