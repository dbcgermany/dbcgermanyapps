"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@dbc/ui";
import { deleteOutreachTemplate } from "@/actions/outreach-templates";

/**
 * Per-row delete button for outreach templates. Uses the shared
 * @dbc/ui ConfirmDialog (same pattern as coupon-row.tsx) so admins
 * get a confirmation step before any destructive write. Refuses to
 * mount the dialog for is_system rows — the server action also
 * refuses, but disabling the trigger client-side keeps the affordance
 * honest.
 */
export function DeleteTemplateButton({
  slug,
  name,
  isSystem,
}: {
  slug: string;
  name: string;
  isSystem: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("admin.outreach.editor");

  if (isSystem) {
    return (
      <button
        type="button"
        disabled
        title={t("cannotDeleteSystem")}
        className="cursor-not-allowed text-xs text-muted-foreground/60"
      >
        {t("delete")}
      </button>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="text-xs text-danger hover:opacity-80"
        >
          {t("delete")}
        </button>
      }
      title={t("delete")}
      description={t("deleteConfirm", { name })}
      variant="danger"
      confirmLabel={t("delete")}
      onConfirm={async () => {
        const res = await deleteOutreachTemplate(slug);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success(t("deleted"));
        router.refresh();
      }}
    />
  );
}
