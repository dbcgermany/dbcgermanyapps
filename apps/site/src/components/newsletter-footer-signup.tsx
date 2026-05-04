"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { subscribeToNewsletter } from "@/actions/newsletter";

export function NewsletterFooterSignup({ locale }: { locale: string }) {
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = useTranslations("site.newsletter.footerSignup");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
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
            marketingConsent: consent,
            source: "footer",
          });
          if ("error" in res && res.error) {
            setMessage({ type: "err", text: res.error });
          } else if ("success" in res && res.alreadySubscribed) {
            setMessage({ type: "ok", text: t("already") });
          } else {
            setMessage({ type: "ok", text: t("success") });
            setEmail("");
            setConsent(false);
          }
        });
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("label")}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{t("hint")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t("placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending || !consent}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? t("sending") : t("submit")}
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>{t("consent")}</span>
      </label>
      {message && (
        <p
          className={`mt-2 text-xs ${
            message.type === "err" ? "text-danger" : "text-success"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
