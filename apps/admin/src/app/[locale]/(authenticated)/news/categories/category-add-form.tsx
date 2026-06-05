"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { createNewsCategory } from "@/actions/news-categories";
import { NEWS_CATEGORY_COLORS } from "@/lib/news-category-palette";

type Result = { error?: string; success?: boolean } | null;

export function CategoryAddForm() {
  const t = useTranslations("admin.news.categories");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<Result, FormData>(
    async (_prev, fd) => createNewsCategory(fd),
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
        <FormField label={t("nameEn")} required>
          <Input name="name_en" required />
        </FormField>
        <FormField label={t("nameDe")}>
          <Input name="name_de" />
        </FormField>
        <FormField label={t("nameFr")}>
          <Input name="name_fr" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("descEn")}>
          <Textarea name="description_en" rows={2} />
        </FormField>
        <FormField label={t("descDe")}>
          <Textarea name="description_de" rows={2} />
        </FormField>
        <FormField label={t("descFr")}>
          <Textarea name="description_fr" rows={2} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("slug")} hint={t("slugHint")}>
          <Input name="slug" className="font-mono" />
        </FormField>
        <FormField label={t("color")}>
          <Select name="color" defaultValue="">
            <option value="">—</option>
            {NEWS_CATEGORY_COLORS.map((c) => (
              <option key={c} value={c}>
                {t(`colors.${c}`)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
