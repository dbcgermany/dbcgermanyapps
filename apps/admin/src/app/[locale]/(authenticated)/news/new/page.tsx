"use client";

import { use, useActionState } from "react";
import { useTranslations } from "next-intl";
import { createNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { CoverImageUpload } from "@/components/cover-image-upload";

const T = {
  en: {
    title: "New news post",
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    excerptEn: "Excerpt (EN)", excerptDe: "Excerpt (DE)", excerptFr: "Excerpt (FR)",
    bodyEn: "Body (EN)", bodyDe: "Body (DE)", bodyFr: "Body (FR)",
    author: "Author (optional)", saving: "Saving…", saveDraft: "Save draft",
  },
  de: {
    title: "Neuer Beitrag",
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    excerptEn: "Kurzfassung (EN)", excerptDe: "Kurzfassung (DE)", excerptFr: "Kurzfassung (FR)",
    bodyEn: "Inhalt (EN)", bodyDe: "Inhalt (DE)", bodyFr: "Inhalt (FR)",
    author: "Autor:in (optional)", saving: "Wird gespeichert…", saveDraft: "Entwurf speichern",
  },
  fr: {
    title: "Nouveau billet",
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    excerptEn: "Extrait (EN)", excerptDe: "Extrait (DE)", excerptFr: "Extrait (FR)",
    bodyEn: "Contenu (EN)", bodyDe: "Contenu (DE)", bodyFr: "Contenu (FR)",
    author: "Auteur (optionnel)", saving: "Enregistrement…", saveDraft: "Enregistrer le brouillon",
  },
} as const;

export default function NewNewsPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
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
        title={t.title}
        back={{ href: `/${locale}/news`, label: tBack("news") }}
      />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        <Field name="title_en" label={t.titleEn} required />
        <Field name="title_de" label={t.titleDe} />
        <Field name="title_fr" label={t.titleFr} />

        <Field name="excerpt_en" label={t.excerptEn} textarea rows={2} />
        <Field name="excerpt_de" label={t.excerptDe} textarea rows={2} />
        <Field name="excerpt_fr" label={t.excerptFr} textarea rows={2} />

        <Field name="body_en" label={t.bodyEn} textarea rows={10} required />
        <Field name="body_de" label={t.bodyDe} textarea rows={10} />
        <Field name="body_fr" label={t.bodyFr} textarea rows={10} />

        <Field name="author_name" label={t.author} />

        <CoverImageUpload />

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
