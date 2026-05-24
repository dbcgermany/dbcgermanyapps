"use client";

import { use, useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EMPLOYMENT_TYPE_VALUES, type EmploymentType } from "@dbc/types";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { createJobOffer } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";

const EMPLOYMENT_TYPE_LABEL_KEY: Record<
  EmploymentType,
  "fullTime" | "partTime" | "freelance" | "internship"
> = {
  full_time: "fullTime",
  part_time: "partTime",
  freelance: "freelance",
  internship: "internship",
};

// createJobOffer ends with redirect() on success — never returns a
// success payload. Only the error branch surfaces here.
type ActionResult = { error?: string } | null;

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

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      return createJobOffer(formData);
    },
    null
  );

  const lastHandledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/job-offers`, label: tBack("jobOffers") }}
      />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        <FormField label={t("titleEn")} required>
          <Input name="title_en" required />
        </FormField>
        <FormField label={t("titleDe")}>
          <Input name="title_de" />
        </FormField>
        <FormField label={t("titleFr")}>
          <Input name="title_fr" />
        </FormField>

        <FormField label={t("descEn")} required>
          <Textarea name="description_en" rows={8} required />
        </FormField>
        <FormField label={t("descDe")}>
          <Textarea name="description_de" rows={8} />
        </FormField>
        <FormField label={t("descFr")}>
          <Textarea name="description_fr" rows={8} />
        </FormField>

        <FormField label={t("reqEn")}>
          <Textarea name="requirements_en" rows={6} />
        </FormField>
        <FormField label={t("reqDe")}>
          <Textarea name="requirements_de" rows={6} />
        </FormField>
        <FormField label={t("reqFr")}>
          <Textarea name="requirements_fr" rows={6} />
        </FormField>

        <FormField label={t("location")}>
          <Input name="location" />
        </FormField>

        <FormField label={t("employmentType")}>
          <Select name="employment_type" defaultValue="">
            <option value="">{t("selectType")}</option>
            {employmentTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label={t("department")}>
          <Input name="department" />
        </FormField>

        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("saveDraft")}
        </Button>
      </form>
    </div>
  );
}
