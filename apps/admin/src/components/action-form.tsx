"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ActionResult = void | null | undefined | { error?: string; success?: boolean };

/**
 * Single source of truth for the inline `<form action={serverAction}>` pattern
 * across the admin app. Wraps the form in useActionState so the server
 * action's return value (`{ error }` / `{ success }`) is captured, toasts
 * the right message, and refreshes the route on success.
 *
 * Why: dozens of pages used `<form action={async () => { 'use server';
 * await someAction() }}>`. The pattern works on the happy path because
 * the action calls `revalidatePath` and Next.js re-renders. But on the
 * error path the returned `{ error }` was silently discarded and the user
 * was left with no feedback. This wrapper closes that gap in one place.
 *
 * Usage:
 *   <ActionForm
 *     action={async () => { "use server"; return toggleNewsPublish(id, locale) }}
 *     successToast={tCommon("publishedToast")}
 *   >
 *     <button type="submit">…</button>
 *   </ActionForm>
 */
export function ActionForm({
  action,
  successToast,
  errorToastTemplate,
  className,
  children,
  onSuccess,
}: {
  /** A server action — already-bound, or wrapped in an inline async fn. */
  action: () => Promise<ActionResult>;
  /** Localized success message shown on a `{ success: true }` or `void` return. */
  successToast?: string;
  /** Optional template like "Action failed: {error}" — `{error}` is replaced. */
  errorToastTemplate?: string;
  className?: string;
  children: React.ReactNode;
  /** Optional client-side callback fired after a successful action. */
  onSuccess?: () => void;
}) {
  const router = useRouter();
  // useActionState's reducer wraps the server action and exposes the latest
  // result. We rely on the latest-result effect below for toast + refresh
  // because the reducer fires once per submission.
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async () => action(),
    null
  );
  const lastHandledRef = useRef<ActionResult>(null);

  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state && typeof state === "object" && "error" in state && state.error) {
      const msg = errorToastTemplate
        ? errorToastTemplate.replace("{error}", state.error)
        : state.error;
      toast.error(msg);
      // Snap UI back to server truth: the action returned an error so
      // whatever optimistic state the user saw should be reverted.
      router.refresh();
      return;
    }
    // Success path. Server action already called revalidatePath, but the
    // current client tree may not have re-fetched yet, so trigger a refresh.
    if (successToast) toast.success(successToast);
    router.refresh();
    onSuccess?.();
  }, [state, errorToastTemplate, successToast, router, onSuccess]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
