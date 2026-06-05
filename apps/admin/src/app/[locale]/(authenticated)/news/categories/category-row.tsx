"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";
import { updateNewsCategory, deleteNewsCategory } from "@/actions/news-categories";
import { NEWS_CATEGORY_COLORS } from "@/lib/news-category-palette";

export type NewsCategory = {
  id: string;
  slug: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  color: string | null;
  sort_order: number;
};

type Result = { error?: string; success?: boolean } | null;

export function CategoryRow({
  category,
  dragHandle,
}: {
  category: NewsCategory;
  dragHandle?: ReactNode;
}) {
  const t = useTranslations("admin.news.categories");
  const tCommon = useTranslations("admin.common");

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={category.name_en}
      meta={<span className="font-mono text-xs">{category.slug}</span>}
      deleteAction={
        <DeleteButton
          action={async () => deleteNewsCategory(category.id)}
          confirmTitle={t("deleteConfirm", { name: category.name_en })}
          confirmLabel={tCommon("delete")}
          cancelLabel={tCommon("cancel")}
          label={tCommon("delete")}
          successToast={t("deletedToast")}
          compact
        />
      }
      renderEdit={({ close }) => (
        <CategoryEditForm category={category} onSaved={close} />
      )}
    />
  );
}

function CategoryEditForm({
  category,
  onSaved,
}: {
  category: NewsCategory;
  onSaved: () => void;
}) {
  const t = useTranslations("admin.news.categories");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const [state, action, pending] = useActionState<Result, FormData>(
    async (_prev, fd) => updateNewsCategory(category.id, fd),
    null
  );
  const last = useRef<Result>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success(tCommon("savedToast"));
      onSaved();
      router.refresh();
    }
  }, [state, router, tCommon, onSaved]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("nameEn")} required>
          <Input name="name_en" defaultValue={category.name_en} required />
        </FormField>
        <FormField label={t("nameDe")}>
          <Input name="name_de" defaultValue={category.name_de ?? ""} />
        </FormField>
        <FormField label={t("nameFr")}>
          <Input name="name_fr" defaultValue={category.name_fr ?? ""} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("descEn")}>
          <Textarea name="description_en" defaultValue={category.description_en ?? ""} rows={2} />
        </FormField>
        <FormField label={t("descDe")}>
          <Textarea name="description_de" defaultValue={category.description_de ?? ""} rows={2} />
        </FormField>
        <FormField label={t("descFr")}>
          <Textarea name="description_fr" defaultValue={category.description_fr ?? ""} rows={2} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("slug")} hint={t("slugHint")}>
          <Input name="slug" defaultValue={category.slug} className="font-mono" />
        </FormField>
        <FormField label={t("color")}>
          <Select name="color" defaultValue={category.color ?? ""}>
            <option value="">—</option>
            {NEWS_CATEGORY_COLORS.map((c) => (
              <option key={c} value={c}>
                {t(`colors.${c}`)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onSaved}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
