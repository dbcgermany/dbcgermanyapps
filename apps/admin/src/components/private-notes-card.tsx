"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@dbc/ui";
import { upsertContactUserState } from "@/actions/contacts";
import { ProfileSection } from "./profile-section";

/**
 * Per-user private notes on a contact. Auto-saves on blur and on
 * Ctrl/Cmd-Enter. Different from `admin_notes` (shared with every team
 * member) — only the current user can see / write this row.
 *
 * Initial value is captured at mount. To re-seed from the server after
 * an outside change, remount via a `key` prop (router.refresh handles
 * the common case by rerendering the whole route).
 */
export function PrivateNotesCard({
  contactId,
  initialNotes,
}: {
  contactId: string;
  initialNotes: string | null;
}) {
  const t = useTranslations("admin.contacts");
  const tCommon = useTranslations("admin.common");
  const [value, setValue] = useState(initialNotes ?? "");
  const lastSaved = useRef(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    if (value === lastSaved.current) return;
    const snapshot = value;
    startTransition(async () => {
      const result = await upsertContactUserState({
        contactId,
        privateNotes: snapshot,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      lastSaved.current = snapshot;
      toast.success(tCommon("savedToast"));
      router.refresh();
    });
  };

  return (
    <ProfileSection
      title={t("profile.sections.privateNotes")}
      description={t("profile.private.caption")}
    >
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        rows={4}
        disabled={isPending}
        placeholder={t("profile.private.placeholder")}
      />
    </ProfileSection>
  );
}
