"use client";

import { use, useActionState } from "react";
import { createJobOffer } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

export default function NewJobOfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createJobOffer(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader title="New job offer" />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        <Field name="title_en" label="Title (EN)" required />
        <Field name="title_de" label="Title (DE)" />
        <Field name="title_fr" label="Title (FR)" />

        <Field name="description_en" label="Description (EN)" textarea rows={8} required />
        <Field name="description_de" label="Description (DE)" textarea rows={8} />
        <Field name="description_fr" label="Description (FR)" textarea rows={8} />

        <Field name="requirements_en" label="Requirements (EN)" textarea rows={6} />
        <Field name="requirements_de" label="Requirements (DE)" textarea rows={6} />
        <Field name="requirements_fr" label="Requirements (FR)" textarea rows={6} />

        <Field name="location" label="Location" />

        <div>
          <label htmlFor="employment_type" className="mb-1 block text-sm font-medium">
            Employment type
          </label>
          <select
            id="employment_type"
            name="employment_type"
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

        <Field name="department" label="Department" />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save draft"}
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
