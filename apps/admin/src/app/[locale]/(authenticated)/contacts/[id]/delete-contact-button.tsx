"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@dbc/ui";
import { deleteContact } from "@/actions/contacts";

export function DeleteContactButton({
  contactId,
  contactEmail,
  locale,
}: {
  contactId: string;
  contactEmail: string;
  locale: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin.contacts");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteContact(contactId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("deletedToast"));
      router.push(`/${locale}/contacts`);
    });
  }

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          disabled={isPending}
          className="rounded-md border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft/40 disabled:opacity-50"
        >
          {t("deleteButton")}
        </button>
      }
      title={t("deleteConfirmTitle")}
      description={t("deleteConfirmDescription", { email: contactEmail })}
      variant="danger"
      confirmLabel={t("deleteButton")}
      onConfirm={handleDelete}
    />
  );
}
