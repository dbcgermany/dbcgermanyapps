"use client";

import { Button } from "@dbc/ui";
import { ActionForm } from "@/components/action-form";

type ActionResult = void | null | undefined | { error?: string; success?: boolean };

/**
 * Standard Publish/Unpublish + Activate/Deactivate toggle. Combines
 * ActionForm (toast + router.refresh) with a Button so every binary toggle
 * across the admin app has the same UX.
 *
 * Caller passes the current state via `isOn` and the labels for both states.
 *
 * Usage:
 *   <ToggleButton
 *     isOn={post.is_published}
 *     onLabel={t("unpublish")}
 *     offLabel={t("publish")}
 *     action={async () => { "use server"; return togglePublish(id, locale) }}
 *     onToast={tCommon("unpublishedToast")}
 *     offToast={tCommon("publishedToast")}
 *   />
 */
export function ToggleButton({
  isOn,
  onLabel,
  offLabel,
  action,
  onToast,
  offToast,
  variant = "secondary",
}: {
  isOn: boolean;
  onLabel: string;
  offLabel: string;
  action: () => Promise<ActionResult>;
  onToast?: string;
  offToast?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <ActionForm
      action={action}
      successToast={isOn ? onToast : offToast}
    >
      <Button type="submit" variant={variant}>
        {isOn ? onLabel : offLabel}
      </Button>
    </ActionForm>
  );
}
