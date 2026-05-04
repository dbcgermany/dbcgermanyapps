"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { subscribeToNewsletter } from "@/actions/newsletter";

type Locale = "en" | "de" | "fr";

const INTEREST_SLUGS = ["founders", "investors", "press", "diaspora"] as const;

export function NewsletterSignupForm({ locale }: { locale: Locale }) {
  const t = useTranslations("site.newsletter.form");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
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
            marketingConsent: consent,
            source: "newsletter_page",
          });
          if ("error" in res && res.error) {
            setMessage({ type: "err", text: res.error });
          } else if ("success" in res && res.alreadySubscribed) {
            setMessage({ type: "ok", text: t("already") });
          } else {
            setMessage({ type: "ok", text: t("success") });
            setEmail("");
            setFirstName("");
            setInterests([]);
            setConsent(false);
          }
        });
      }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium">{t("emailLabel")}</label>
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
        <label className="block text-sm font-medium">{t("firstNameLabel")}</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p className="text-sm font-medium">{t("interestsLabel")}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {INTEREST_SLUGS.map((slug) => (
            <label
              key={slug}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={interests.includes(slug)}
                onChange={(e) =>
                  setInterests((prev) =>
                    e.target.checked
                      ? [...prev, slug]
                      : prev.filter((s) => s !== slug)
                  )
                }
              />
              {t(`interests.${slug}` as
                | "interests.founders"
                | "interests.investors"
                | "interests.press"
                | "interests.diaspora")}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>{t("consentLabel")}</span>
      </label>
      <button
        type="submit"
        disabled={isPending || !consent}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPending ? t("sending") : t("submit")}
      </button>
      {message && (
        <p
          className={`text-sm ${
            message.type === "err" ? "text-danger" : "text-success"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
