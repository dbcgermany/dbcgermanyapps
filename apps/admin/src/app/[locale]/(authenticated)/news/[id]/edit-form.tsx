"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { updateNewsPost } from "@/actions/news";
import { CoverImageUpload } from "@/components/cover-image-upload";

const T = {
  en: {
    saved: "Saved",
    slug: "Slug", slugHelp: "URL-safe identifier. Leave unchanged to keep the current one.",
    titleEn: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    excerptEn: "Excerpt (EN)", excerptDe: "Excerpt (DE)", excerptFr: "Excerpt (FR)",
    bodyEn: "Body (EN)", bodyDe: "Body (DE)", bodyFr: "Body (FR)",
    author: "Author", saving: "Saving…", save: "Save",
  },
  de: {
    saved: "Gespeichert",
    slug: "Slug", slugHelp: "URL-Kennung. Unverändert lassen, um die aktuelle beizubehalten.",
    titleEn: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    excerptEn: "Kurzfassung (EN)", excerptDe: "Kurzfassung (DE)", excerptFr: "Kurzfassung (FR)",
    bodyEn: "Inhalt (EN)", bodyDe: "Inhalt (DE)", bodyFr: "Inhalt (FR)",
    author: "Autor", saving: "Wird gespeichert…", save: "Speichern",
  },
  fr: {
    saved: "Enregistré",
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

type ActionResult = { error?: string; success?: boolean } | null;

export function EditNewsForm({ locale, post }: { locale: string; post: Post }) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      return updateNewsPost(post.id, formData);
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
      <FormField label={t.slug} hint={t.slugHelp}>
        <Input
          name="slug"
          defaultValue={post.slug}
          className="font-mono"
        />
      </FormField>

      <FormField label={t.titleEn} required>
        <Input name="title_en" defaultValue={post.title_en} required />
      </FormField>
      <FormField label={t.titleDe}>
        <Input name="title_de" defaultValue={post.title_de} />
      </FormField>
      <FormField label={t.titleFr}>
        <Input name="title_fr" defaultValue={post.title_fr} />
      </FormField>

      <FormField label={t.excerptEn}>
        <Textarea name="excerpt_en" defaultValue={post.excerpt_en ?? ""} rows={2} />
      </FormField>
      <FormField label={t.excerptDe}>
        <Textarea name="excerpt_de" defaultValue={post.excerpt_de ?? ""} rows={2} />
      </FormField>
      <FormField label={t.excerptFr}>
        <Textarea name="excerpt_fr" defaultValue={post.excerpt_fr ?? ""} rows={2} />
      </FormField>

      <FormField label={t.bodyEn} required>
        <Textarea name="body_en" defaultValue={post.body_en} rows={12} required />
      </FormField>
      <FormField label={t.bodyDe}>
        <Textarea name="body_de" defaultValue={post.body_de} rows={12} />
      </FormField>
      <FormField label={t.bodyFr}>
        <Textarea name="body_fr" defaultValue={post.body_fr} rows={12} />
      </FormField>

      <FormField label={t.author}>
        <Input name="author_name" defaultValue={post.author_name ?? ""} />
      </FormField>

      <CoverImageUpload initialUrl={post.cover_image_url} />

      <Button type="submit" disabled={isPending}>
        {isPending ? t.saving : t.save}
      </Button>
    </form>
  );
}
