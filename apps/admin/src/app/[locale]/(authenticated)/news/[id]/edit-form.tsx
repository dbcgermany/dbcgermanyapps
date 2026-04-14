"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateNewsPost } from "@/actions/news";
import { CoverImageUpload } from "@/components/cover-image-upload";

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
          Saved.
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Slug: <code>{post.slug}</code>
      </p>

      <F name="title_en" label="Title (EN)" defaultValue={post.title_en} required />
      <F name="title_de" label="Title (DE)" defaultValue={post.title_de} />
      <F name="title_fr" label="Title (FR)" defaultValue={post.title_fr} />

      <F
        name="excerpt_en"
        label="Excerpt (EN)"
        defaultValue={post.excerpt_en ?? ""}
        textarea
        rows={2}
      />
      <F
        name="excerpt_de"
        label="Excerpt (DE)"
        defaultValue={post.excerpt_de ?? ""}
        textarea
        rows={2}
      />
      <F
        name="excerpt_fr"
        label="Excerpt (FR)"
        defaultValue={post.excerpt_fr ?? ""}
        textarea
        rows={2}
      />

      <F
        name="body_en"
        label="Body (EN)"
        defaultValue={post.body_en}
        textarea
        rows={12}
        required
      />
      <F
        name="body_de"
        label="Body (DE)"
        defaultValue={post.body_de}
        textarea
        rows={12}
      />
      <F
        name="body_fr"
        label="Body (FR)"
        defaultValue={post.body_fr}
        textarea
        rows={12}
      />

      <F
        name="author_name"
        label="Author"
        defaultValue={post.author_name ?? ""}
      />

      <CoverImageUpload initialUrl={post.cover_image_url} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
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
