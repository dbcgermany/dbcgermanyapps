"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { joinWaitlist } from "@/actions/waitlist";

export function WaitlistButton({
  eventId,
  tierId,
  eventSlug,
  locale,
}: {
  eventId: string;
  tierId: string;
  eventSlug: string;
  locale: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("tickets.events.waitlist");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await joinWaitlist({
        eventId,
        tierId,
        eventSlug,
        email,
        locale,
      });
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <p className="mt-2 text-xs font-medium text-success">
        {t("done")}
      </p>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-2 text-xs font-medium text-primary hover:text-primary/80"
      >
        {t("join")} &rarr;
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
        className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
      {error && (
        <p className="absolute mt-8 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
