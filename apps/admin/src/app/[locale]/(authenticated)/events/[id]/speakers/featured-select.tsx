"use client";

import { useTransition } from "react";
import { setEventSpeakerFeatured } from "@/actions/speakers";

const LABELS: Record<"en" | "de" | "fr", { yes: string; no: string }> = {
  en: { yes: "Featured", no: "Standard" },
  de: { yes: "Hervorgehoben", no: "Standard" },
  fr: { yes: "Mis en avant", no: "Standard" },
};

export function FeaturedSelect({
  eventId,
  speakerId,
  current,
  locale,
}: {
  eventId: string;
  speakerId: string;
  current: boolean;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const labels =
    LABELS[(locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr"];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value === "yes";
    startTransition(async () => {
      await setEventSpeakerFeatured(eventId, speakerId, next, locale);
    });
  }

  return (
    <select
      value={current ? "yes" : "no"}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      <option value="yes">{labels.yes}</option>
      <option value="no">{labels.no}</option>
    </select>
  );
}
