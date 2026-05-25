"use client";

import { Select } from "@dbc/ui";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { toggleRunsheetItemPublic } from "@/actions/runsheet";

// Inline visibility-style picker for a runsheet row's public/internal flag.
// Mirrors VisibilitySelect on the /team page so the admin reads as one app,
// not a patchwork — same compact <Select>, same tone-of-voice labels.
const LABELS = {
  en: { public: "Public", internal: "Internal" },
  de: { public: "Öffentlich", internal: "Intern" },
  fr: { public: "Public", internal: "Interne" },
} as const;

export function RunsheetPublicSelect({
  id,
  eventId,
  current,
  locale,
}: {
  id: string;
  eventId: string;
  current: boolean;
  locale: string;
}) {
  const tCommon = useTranslations("admin.common");
  const labels =
    LABELS[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS];

  const [optimistic, setOptimistic] = useOptimistic(
    current,
    (_: boolean, next: boolean) => next
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value === "public";
    startTransition(async () => {
      setOptimistic(next);
      const res = await toggleRunsheetItemPublic(id, eventId, locale, next);
      if ("error" in res && res.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
      }
    });
  }

  return (
    <Select
      value={optimistic ? "public" : "internal"}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      aria-label={labels.public + " / " + labels.internal}
    >
      <option value="public">{labels.public}</option>
      <option value="internal">{labels.internal}</option>
    </Select>
  );
}
