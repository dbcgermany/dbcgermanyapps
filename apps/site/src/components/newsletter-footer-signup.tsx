"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";

const COPY = {
  en: {
    label: "Newsletter",
    hint: "Event drops, incubation calls, diaspora-economy briefs. Unsubscribe in one click.",
    placeholder: "you@example.com",
    submit: "Subscribe",
    sending: "Sending…",
    success: "Almost done — check your inbox to confirm.",
    already: "You're already subscribed.",
  },
  de: {
    label: "Newsletter",
    hint: "Veranstaltungen, Incubation-Calls, Briefings zur Diaspora-Wirtschaft. Jederzeit abmeldbar.",
    placeholder: "sie@beispiel.de",
    submit: "Abonnieren",
    sending: "Wird gesendet…",
    success: "Fast fertig — bitte best\u00e4tigen Sie die E-Mail in Ihrem Postfach.",
    already: "Sie sind bereits angemeldet.",
  },
  fr: {
    label: "Newsletter",
    hint: "\u00c9v\u00e9nements, appels d'incubation, notes sur l'\u00e9conomie de la diaspora. D\u00e9sinscription en un clic.",
    placeholder: "vous@exemple.fr",
    submit: "S'abonner",
    sending: "Envoi…",
    success: "Presque termin\u00e9 — confirmez via l'e-mail que nous vous avons envoy\u00e9.",
    already: "Vous \u00eates d\u00e9j\u00e0 abonn\u00e9\u00b7e.",
  },
};

export function NewsletterFooterSignup({ locale }: { locale: string }) {
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = COPY[key];
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await subscribeToNewsletter({
            email,
            locale: key,
            source: "footer",
          });
          if ("error" in res && res.error) {
            setMessage({ type: "err", text: res.error });
          } else if ("success" in res && res.alreadySubscribed) {
            setMessage({ type: "ok", text: t.already });
          } else {
            setMessage({ type: "ok", text: t.success });
            setEmail("");
          }
        });
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t.label}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{t.hint}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? t.sending : t.submit}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-xs ${
            message.type === "err" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
