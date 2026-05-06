"use client";

import { useTransition } from "react";
import { setSpeakerVisibility } from "@/actions/speakers";

type Visibility = "public" | "internal" | "hidden";

const LABELS: Record<string, Record<Visibility, string>> = {
  en: { public: "Public", internal: "Internal", hidden: "Hidden" },
  de: { public: "Öffentlich", internal: "Intern", hidden: "Versteckt" },
  fr: { public: "Public", internal: "Interne", hidden: "Masqué" },
};

const VALUES: Visibility[] = ["public", "internal", "hidden"];

export function SpeakerVisibilitySelect({
  id,
  current,
  locale,
}: {
  id: string;
  current: Visibility;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const labels =
    LABELS[
      (locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS
    ];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Visibility;
    startTransition(async () => {
      await setSpeakerVisibility(id, next, locale);
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {VALUES.map((o) => (
        <option key={o} value={o}>
          {labels[o]}
        </option>
      ))}
    </select>
  );
}
