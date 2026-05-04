"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { fireFunnelConversion } from "./funnel-analytics";

// Minimal lead-capture form for funnels with cta_type='contact_form'.
// The v1 ship stubs the submit to the funnels/track endpoint (recording
// a conversion) + console logging. A follow-up will wire a dedicated
// server action that emails the lead + stores the row.
export function FunnelContactForm({
  funnelId,
  locale,
  cta,
}: {
  funnelId: string;
  locale: string;
  cta: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("site.funnel.contactForm");

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-heading text-lg font-semibold">{t("thanks")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("thanksBody")}</p>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => {
          fireFunnelConversion(funnelId, locale);
          setSubmitted(true);
        });
      }}
    >
      <FormField label={t("name")} required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      <FormField label={t("email")} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormField>
      <FormField label={t("message")}>
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {cta}
      </Button>
    </form>
  );
}
