"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";

type Locale = "en" | "de" | "fr";

const COPY = {
  en: {
    emailLabel: "Email",
    firstNameLabel: "First name (optional)",
    interestsLabel: "What brings you here? (optional)",
    submit: "Subscribe",
    sending: "Sending…",
    success:
      "Thanks! We've sent a confirmation email. Click the link inside to finish subscribing.",
    already: "You're already subscribed — thanks!",
  },
  de: {
    emailLabel: "E-Mail",
    firstNameLabel: "Vorname (optional)",
    interestsLabel: "Was f\u00fchrt Sie zu uns? (optional)",
    submit: "Abonnieren",
    sending: "Wird gesendet…",
    success:
      "Danke! Wir haben Ihnen eine Best\u00e4tigungs-E-Mail geschickt. Klicken Sie den Link darin, um die Anmeldung abzuschlie\u00dfen.",
    already: "Sie sind bereits angemeldet — vielen Dank!",
  },
  fr: {
    emailLabel: "E-mail",
    firstNameLabel: "Pr\u00e9nom (optionnel)",
    interestsLabel: "Qu'est-ce qui vous am\u00e8ne ? (optionnel)",
    submit: "S'abonner",
    sending: "Envoi…",
    success:
      "Merci ! Nous vous avons envoy\u00e9 un e-mail de confirmation. Cliquez sur le lien pour finaliser.",
    already: "Vous \u00eates d\u00e9j\u00e0 abonn\u00e9\u00b7e — merci !",
  },
} satisfies Record<Locale, Record<string, string>>;

const INTERESTS: Array<{
  slug: string;
  labels: Record<Locale, string>;
}> = [
  {
    slug: "founders",
    labels: {
      en: "Founders & Entrepreneurs",
      de: "Gr\u00fcnder:innen & Unternehmer:innen",
      fr: "Fondateur\u00b7ice\u00b7s & entrepreneur\u00b7e\u00b7s",
    },
  },
  {
    slug: "investors",
    labels: {
      en: "Investors & LPs",
      de: "Investor:innen",
      fr: "Investisseur\u00b7euse\u00b7s",
    },
  },
  {
    slug: "press",
    labels: { en: "Press & Media", de: "Presse & Medien", fr: "Presse & m\u00e9dias" },
  },
  {
    slug: "diaspora",
    labels: {
      en: "Diaspora community",
      de: "Diaspora-Community",
      fr: "Communaut\u00e9 de la diaspora",
    },
  },
];

export function NewsletterSignupForm({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await subscribeToNewsletter({
            email,
            firstName: firstName || undefined,
            locale,
            interestSlugs: interests,
            source: "newsletter_page",
          });
          if ("error" in res && res.error) {
            setMessage({ type: "err", text: res.error });
          } else if ("success" in res && res.alreadySubscribed) {
            setMessage({ type: "ok", text: t.already });
          } else {
            setMessage({ type: "ok", text: t.success });
            setEmail("");
            setFirstName("");
            setInterests([]);
          }
        });
      }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium">{t.emailLabel}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{t.firstNameLabel}</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p className="text-sm font-medium">{t.interestsLabel}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {INTERESTS.map((opt) => (
            <label
              key={opt.slug}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={interests.includes(opt.slug)}
                onChange={(e) =>
                  setInterests((prev) =>
                    e.target.checked
                      ? [...prev, opt.slug]
                      : prev.filter((s) => s !== opt.slug)
                  )
                }
              />
              {opt.labels[locale]}
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPending ? t.sending : t.submit}
      </button>
      {message && (
        <p
          className={`text-sm ${
            message.type === "err" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
