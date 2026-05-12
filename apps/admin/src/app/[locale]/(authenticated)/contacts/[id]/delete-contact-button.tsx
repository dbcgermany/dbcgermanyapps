"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteContact(contactId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Contact deleted");
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
          Delete contact
        </button>
      }
      title="Delete contact permanently"
      description={`This permanently removes ${contactEmail} along with their messages, category links and event involvements. Linked tickets and orders are preserved without the contact reference. This cannot be undone.`}
      variant="danger"
      confirmLabel="Delete contact"
      onConfirm={handleDelete}
    />
  );
}
