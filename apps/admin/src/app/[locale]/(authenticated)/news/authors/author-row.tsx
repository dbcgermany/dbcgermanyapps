"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge, Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { updateAuthor, deleteAuthor } from "@/actions/authors";
import { AUTHOR_TYPES } from "@/lib/author-types";

export type Author = {
  id: string;
  slug: string;
  display_name: string;
  type: string;
  role_title_en: string | null;
  role_title_de: string | null;
  role_title_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  photo_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  is_org_default: boolean;
  is_public: boolean;
  sort_order: number;
};

type Result = { error?: string; success?: boolean } | null;
const CREATABLE_TYPES = AUTHOR_TYPES.filter((t) => t !== "dbc_org");

export function AuthorRow({
  author,
  dragHandle,
}: {
  author: Author;
  dragHandle?: ReactNode;
}) {
  const t = useTranslations("admin.news.authors");
  const tCommon = useTranslations("admin.common");

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={author.display_name}
      badges={<Badge variant="accent">{t(`types.${author.type}`)}</Badge>}
      meta={<span className="font-mono text-xs">{author.slug}</span>}
      deleteAction={
        author.is_org_default ? undefined : (
          <DeleteButton
            action={async () => deleteAuthor(author.id)}
            confirmTitle={t("deleteConfirm", { name: author.display_name })}
            confirmLabel={tCommon("delete")}
            cancelLabel={tCommon("cancel")}
            label={tCommon("delete")}
            successToast={t("deletedToast")}
            compact
          />
        )
      }
      renderEdit={({ close }) => <AuthorEditForm author={author} onSaved={close} />}
    />
  );
}

function AuthorEditForm({ author, onSaved }: { author: Author; onSaved: () => void }) {
  const t = useTranslations("admin.news.authors");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const [state, action, pending] = useActionState<Result, FormData>(
    async (_prev, fd) => updateAuthor(author.id, fd),
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
        <FormField label={t("displayName")} required>
          <Input name="display_name" defaultValue={author.display_name} required />
        </FormField>
        <FormField label={t("type")}>
          <Select name="type" defaultValue={author.type}>
            {(author.is_org_default ? AUTHOR_TYPES : CREATABLE_TYPES).map((ty) => (
              <option key={ty} value={ty}>
                {t(`types.${ty}`)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("slug")} hint={t("slugHint")}>
          <Input name="slug" defaultValue={author.slug} className="font-mono" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("roleEn")}>
          <Input name="role_title_en" defaultValue={author.role_title_en ?? ""} />
        </FormField>
        <FormField label={t("roleDe")}>
          <Input name="role_title_de" defaultValue={author.role_title_de ?? ""} />
        </FormField>
        <FormField label={t("roleFr")}>
          <Input name="role_title_fr" defaultValue={author.role_title_fr ?? ""} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("bioEn")}>
          <Textarea name="bio_en" defaultValue={author.bio_en ?? ""} rows={2} />
        </FormField>
        <FormField label={t("bioDe")}>
          <Textarea name="bio_de" defaultValue={author.bio_de ?? ""} rows={2} />
        </FormField>
        <FormField label={t("bioFr")}>
          <Textarea name="bio_fr" defaultValue={author.bio_fr ?? ""} rows={2} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("email")}>
          <Input name="email" type="email" defaultValue={author.email ?? ""} />
        </FormField>
        <FormField label={t("linkedin")}>
          <Input name="linkedin_url" defaultValue={author.linkedin_url ?? ""} />
        </FormField>
        <FormField label={t("website")}>
          <Input name="website_url" defaultValue={author.website_url ?? ""} />
        </FormField>
        <FormField label={t("instagram")}>
          <Input name="instagram_url" defaultValue={author.instagram_url ?? ""} />
        </FormField>
      </div>
      <FormField label={t("photo")}>
        <CoverImageUpload name="photo_url" initialUrl={author.photo_url} />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={author.is_public}
          className="h-4 w-4 rounded border-input"
        />
        {t("public")}
      </label>
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
