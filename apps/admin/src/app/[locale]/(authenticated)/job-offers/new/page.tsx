"use client";

import { use, useActionState } from "react";
import { useTranslations } from "next-intl";
import { EMPLOYMENT_TYPE_VALUES, type EmploymentType } from "@dbc/types";
import { Button } from "@dbc/ui";
import { createJobOffer } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";

const EMPLOYMENT_TYPE_LABEL_KEY: Record<EmploymentType, "fullTime" | "partTime" | "freelance" | "internship"> = {
  full_time: "fullTime",
  part_time: "partTime",
  freelance: "freelance",
  internship: "internship",
};

export default function NewJobOfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("admin.jobOffers.new");
  const tBack = useTranslations("admin.back");

  const employmentTypes = EMPLOYMENT_TYPE_VALUES.map((value) => ({
    value,
    label: t(EMPLOYMENT_TYPE_LABEL_KEY[value]),
  }));

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createJobOffer(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/job-offers`, label: tBack("jobOffers") }}
      />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-danger-soft p-4 text-sm text-danger">
            {state.error}
          </div>
        )}

        <Field name="title_en" label={t("titleEn")} required />
        <Field name="title_de" label={t("titleDe")} />
        <Field name="title_fr" label={t("titleFr")} />

        <Field name="description_en" label={t("descEn")} textarea rows={8} required />
        <Field name="description_de" label={t("descDe")} textarea rows={8} />
        <Field name="description_fr" label={t("descFr")} textarea rows={8} />

        <Field name="requirements_en" label={t("reqEn")} textarea rows={6} />
        <Field name="requirements_de" label={t("reqDe")} textarea rows={6} />
        <Field name="requirements_fr" label={t("reqFr")} textarea rows={6} />

        <Field name="location" label={t("location")} />

        <div>
          <label htmlFor="employment_type" className="mb-1 block text-sm font-medium">
            {t("employmentType")}
          </label>
          <select
            id="employment_type"
            name="employment_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("selectType")}</option>
            {employmentTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        <Field name="department" label={t("department")} />

        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("saveDraft")}
        </Button>
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
