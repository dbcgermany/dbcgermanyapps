"use client";

import { useState, useTransition } from "react";
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

  const labels = LABELS[
    (locale === "de" || locale === "fr" ? locale : "en") as keyof typeof LABELS
  ];

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-heading text-lg font-semibold">{labels.thanks}</p>
        <p className="mt-1 text-sm text-muted-foreground">{labels.thanksBody}</p>
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
      <FormField label={labels.name} required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </FormField>
      <FormField label={labels.email} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormField>
      <FormField label={labels.message}>
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

const LABELS = {
  en: {
    name: "Name",
    email: "Email",
    message: "Message (optional)",
    thanks: "Thanks — we got it.",
    thanksBody: "Someone from the team will reach out within 2 business days.",
  },
  de: {
    name: "Name",
    email: "E-Mail",
    message: "Nachricht (optional)",
    thanks: "Danke \u2014 haben wir erhalten.",
    thanksBody: "Das Team meldet sich innerhalb von 2 Werktagen.",
  },
  fr: {
    name: "Nom",
    email: "E-mail",
    message: "Message (optionnel)",
    thanks: "Merci \u2014 bien re\u00e7u.",
    thanksBody: "L'\u00e9quipe te recontacte sous 2 jours ouvr\u00e9s.",
  },
} as const;
