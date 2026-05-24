"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog } from "@dbc/ui";

type ActionResult = void | null | undefined | { error?: string; success?: boolean };

/**
 * Standard delete affordance with confirmation dialog and toast feedback.
 * Wraps the existing @dbc/ui ConfirmDialog and routes the server-action
 * result through sonner so the operator gets the same feedback everywhere.
 *
 * Use `compact` when sitting inside a list row — renders a ghost icon button
 * instead of a labeled secondary button.
 *
 * IMPORTANT — server vs. client component boundary:
 *   This component is "use client". When you pass an inline `async () => …`
 *   to `action` from a SERVER component, Next.js cannot serialise the
 *   closure across the boundary unless it's marked as a server action.
 *   Always include the "use server" directive INSIDE the inline async:
 *
 *     // ✅ from a server component
 *     <DeleteButton
 *       action={async () => { "use server"; return deleteX(id, locale); }}
 *       …
 *     />
 *
 *     // ✅ from a client component (the closure stays client-side and
 *     //    calls the server action itself — no marker needed)
 *     <DeleteButton action={async () => deleteX(id, locale)} … />
 *
 *   Omitting the directive in a server component triggers a server-side
 *   render error with a generic "Server Components render" message — the
 *   page works in dev but crashes in production. Caught the hard way on
 *   /events/[id]/budget/[expenseId] in 2026-05.
 */
export function DeleteButton({
  action,
  confirmTitle,
  confirmDescription,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  label = "Delete",
  successToast,
  compact = false,
}: {
  action: () => Promise<ActionResult>;
  confirmTitle: string;
  confirmDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  label?: string;
  successToast?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onConfirm() {
    await new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await action();
        if (result && typeof result === "object" && "error" in result && result.error) {
          toast.error(result.error);
        } else {
          if (successToast) toast.success(successToast);
          router.refresh();
        }
        resolve();
      });
    });
  }

  const trigger = compact ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-danger hover:bg-danger-soft"
      title={label}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      <span className="sr-only">{label}</span>
    </Button>
  ) : (
    <Button type="button" variant="destructive" disabled={isPending}>
      <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      {label}
    </Button>
  );

  return (
    <ConfirmDialog
      trigger={trigger}
      title={confirmTitle}
      description={confirmDescription}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant="danger"
      onConfirm={onConfirm}
    />
  );
}
