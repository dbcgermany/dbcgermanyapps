"use client";

import { use, useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { createNewsPost } from "@/actions/news";
import { PageHeader } from "@/components/page-header";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { NewsCategoryPicker } from "@/components/news-category-picker";

// createNewsPost ends with redirect() on success — the action never
// returns a success payload (Next.js navigates server-side and the
// operator lands on /news/[id]). Only the error branch surfaces here.
type ActionResult = { error?: string } | null;

export default function NewNewsPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("admin.news.new");
  const tBack = useTranslations("admin.back");

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      return createNewsPost(formData);
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
        back={{ href: `/${locale}/news`, label: tBack("news") }}
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

        <FormField label={t("excerptEn")}>
          <Textarea name="excerpt_en" rows={2} />
        </FormField>
        <FormField label={t("excerptDe")}>
          <Textarea name="excerpt_de" rows={2} />
        </FormField>
        <FormField label={t("excerptFr")}>
          <Textarea name="excerpt_fr" rows={2} />
        </FormField>

        <FormField label={t("bodyEn")} required hint={t("bodyHint")}>
          <Textarea name="body_en" rows={10} required />
        </FormField>
        <FormField label={t("bodyDe")}>
          <Textarea name="body_de" rows={10} />
        </FormField>
        <FormField label={t("bodyFr")}>
          <Textarea name="body_fr" rows={10} />
        </FormField>

        <FormField label={t("author")}>
          <Input name="author_name" />
        </FormField>

        <NewsCategoryPicker locale={locale} />

        <CoverImageUpload />

        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("saveDraft")}
        </Button>
      </form>
    </div>
  );
}
