"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { createAuthor } from "@/actions/authors";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { AUTHOR_TYPES } from "@/lib/author-types";

type Result = { error?: string; success?: boolean } | null;

// dbc_org is the seeded default org author — not manually creatable.
const CREATABLE_TYPES = AUTHOR_TYPES.filter((t) => t !== "dbc_org");

export function AuthorAddForm() {
  const t = useTranslations("admin.news.authors");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<Result, FormData>(
    async (_prev, fd) => createAuthor(fd),
    null
  );
  const last = useRef<Result>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success(t("createdToast"));
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router, t]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-6 space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <h2 className="font-heading text-lg font-semibold">{t("add")}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("displayName")} required>
          <Input name="display_name" required />
        </FormField>
        <FormField label={t("type")}>
          <Select name="type" defaultValue="guest">
            {CREATABLE_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`types.${ty}`)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("slug")} hint={t("slugHint")}>
          <Input name="slug" className="font-mono" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("roleEn")}>
          <Input name="role_title_en" />
        </FormField>
        <FormField label={t("roleDe")}>
          <Input name="role_title_de" />
        </FormField>
        <FormField label={t("roleFr")}>
          <Input name="role_title_fr" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("bioEn")}>
          <Textarea name="bio_en" rows={2} />
        </FormField>
        <FormField label={t("bioDe")}>
          <Textarea name="bio_de" rows={2} />
        </FormField>
        <FormField label={t("bioFr")}>
          <Textarea name="bio_fr" rows={2} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("email")}>
          <Input name="email" type="email" />
        </FormField>
        <FormField label={t("linkedin")}>
          <Input name="linkedin_url" />
        </FormField>
        <FormField label={t("website")}>
          <Input name="website_url" />
        </FormField>
        <FormField label={t("instagram")}>
          <Input name="instagram_url" />
        </FormField>
      </div>
      <FormField label={t("photo")}>
        <CoverImageUpload name="photo_url" />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
