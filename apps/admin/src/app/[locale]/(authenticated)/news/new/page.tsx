"use client";

import { use, useActionState } from "react";
import { createNewsPost } from "@/actions/news";
import { CoverImageUpload } from "@/components/cover-image-upload";

export default function NewNewsPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createNewsPost(formData);
    },
    null
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">New news post</h1>

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        <Field name="title_en" label="Title (EN)" required />
        <Field name="title_de" label="Title (DE)" />
        <Field name="title_fr" label="Title (FR)" />

        <Field
          name="excerpt_en"
          label="Excerpt (EN)"
          textarea
          rows={2}
        />
        <Field name="excerpt_de" label="Excerpt (DE)" textarea rows={2} />
        <Field name="excerpt_fr" label="Excerpt (FR)" textarea rows={2} />

        <Field name="body_en" label="Body (EN)" textarea rows={10} required />
        <Field name="body_de" label="Body (DE)" textarea rows={10} />
        <Field name="body_fr" label="Body (FR)" textarea rows={10} />

        <Field name="author_name" label="Author (optional)" />

        <CoverImageUpload />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save draft"}
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
