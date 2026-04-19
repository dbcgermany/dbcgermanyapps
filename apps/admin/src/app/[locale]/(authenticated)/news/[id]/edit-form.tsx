"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateNewsPost } from "@/actions/news";
import { CoverImageUpload } from "@/components/cover-image-upload";

const T = {
  en: {
    saved: "Saved.",
    slug: "Slug", slugHelp: "URL-safe identifier. Leave unchanged to keep the current one.",
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    excerptEn: "Excerpt (EN)", excerptDe: "Excerpt (DE)", excerptFr: "Excerpt (FR)",
    bodyEn: "Body (EN)", bodyDe: "Body (DE)", bodyFr: "Body (FR)",
    author: "Author", saving: "Saving…", save: "Save",
  },
  de: {
    saved: "Gespeichert.",
    slug: "Slug", slugHelp: "URL-Kennung. Unverändert lassen, um die aktuelle beizubehalten.",
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    excerptEn: "Kurzfassung (EN)", excerptDe: "Kurzfassung (DE)", excerptFr: "Kurzfassung (FR)",
    bodyEn: "Inhalt (EN)", bodyDe: "Inhalt (DE)", bodyFr: "Inhalt (FR)",
    author: "Autor:in", saving: "Wird gespeichert…", save: "Speichern",
  },
  fr: {
    saved: "Enregistré.",
    slug: "Slug", slugHelp: "Identifiant d’URL. Laissez inchangé pour conserver l’actuel.",
    titleEn: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    excerptEn: "Extrait (EN)", excerptDe: "Extrait (DE)", excerptFr: "Extrait (FR)",
    bodyEn: "Contenu (EN)", bodyDe: "Contenu (DE)", bodyFr: "Contenu (FR)",
    author: "Auteur", saving: "Enregistrement…", save: "Enregistrer",
  },
} as const;

type Post = {
  id: string;
  slug: string;
  title_en: string;
  title_de: string;
  title_fr: string;
  excerpt_en: string | null;
  excerpt_de: string | null;
  excerpt_fr: string | null;
  body_en: string;
  body_de: string;
  body_fr: string;
  cover_image_url: string | null;
  author_name: string | null;
};

export function EditNewsForm({ locale, post }: { locale: string; post: Post }) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("locale", locale);
      return updateNewsPost(post.id, formData);
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

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium">
          {t.slug}
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={post.slug}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t.slugHelp}</p>
      </div>

      <F name="title_en" label={t.titleEn} defaultValue={post.title_en} required />
      <F name="title_de" label={t.titleDe} defaultValue={post.title_de} />
      <F name="title_fr" label={t.titleFr} defaultValue={post.title_fr} />

      <F name="excerpt_en" label={t.excerptEn} defaultValue={post.excerpt_en ?? ""} textarea rows={2} />
      <F name="excerpt_de" label={t.excerptDe} defaultValue={post.excerpt_de ?? ""} textarea rows={2} />
      <F name="excerpt_fr" label={t.excerptFr} defaultValue={post.excerpt_fr ?? ""} textarea rows={2} />

      <F name="body_en" label={t.bodyEn} defaultValue={post.body_en} textarea rows={12} required />
      <F name="body_de" label={t.bodyDe} defaultValue={post.body_de} textarea rows={12} />
      <F name="body_fr" label={t.bodyFr} defaultValue={post.body_fr} textarea rows={12} />

      <F name="author_name" label={t.author} defaultValue={post.author_name ?? ""} />

      <CoverImageUpload initialUrl={post.cover_image_url} />

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
