"use client";

import { use, useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@dbc/ui";
import { createNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { CoverImageUpload } from "@/components/cover-image-upload";

export default function NewNewsPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("admin.news.new");
  const tBack = useTranslations("admin.back");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createNewsPost(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader
        title={t("title")}
        back={{ href: `/${locale}/news`, label: tBack("news") }}
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

        <Field name="excerpt_en" label={t("excerptEn")} textarea rows={2} />
        <Field name="excerpt_de" label={t("excerptDe")} textarea rows={2} />
        <Field name="excerpt_fr" label={t("excerptFr")} textarea rows={2} />

        <Field name="body_en" label={t("bodyEn")} textarea rows={10} required />
        <Field name="body_de" label={t("bodyDe")} textarea rows={10} />
        <Field name="body_fr" label={t("bodyFr")} textarea rows={10} />

        <Field name="author_name" label={t("author")} />

        <CoverImageUpload />

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
  const props = {
    id: name,
    name,
    defaultValue,
    required,
    className:
      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
  } as const;
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {textarea ? <textarea rows={rows ?? 4} {...props} /> : <input type="text" {...props} />}
    </div>
  );
}
