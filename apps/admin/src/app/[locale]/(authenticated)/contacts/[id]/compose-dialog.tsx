"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { sendContactMessage } from "@/actions/contact-messages";
import {
  getOutreachTemplateForContact,
  type OutreachTemplateSummary,
} from "@/actions/outreach-templates";
import { Button } from "@dbc/ui";

const FREE_FORM_SLUG = "__free__";
const LOCALES = ["en", "de", "fr"] as const;
type Locale = (typeof LOCALES)[number];

export function ComposeDialog({
  contactId,
  contactEmail,
  defaultLocale,
  templates,
}: {
  contactId: string;
  contactEmail: string;
  defaultLocale: string;
  /** Available outreach templates (free-form is added implicitly). Server
   *  fetches this once when the contact page renders so the picker is
   *  ready-to-go on open. */
  templates: OutreachTemplateSummary[];
}) {
  const t = useTranslations("admin.outreach.compose");
  const tLocale = useTranslations("admin.outreach.locales");

  const localeKey = (defaultLocale === "de" || defaultLocale === "fr"
    ? defaultLocale
    : "en") as Locale;

  const [open, setOpen] = useState(false);
  const [templateSlug, setTemplateSlug] = useState<string>(FREE_FORM_SLUG);
  const [language, setLanguage] = useState<Locale>(localeKey);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [msg, setMsg] = useState<{ type: "err"; text: string } | null>(null);
  // Persistent success state. Keeping the dialog mounted in this branch so
  // the operator can't miss the confirmation (the previous 1.2s auto-close
  // toast was easy to lose). "Send another" resets, "Close" dismisses.
  const [sentInfo, setSentInfo] = useState<{
    email: string;
    timeLabel: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Whenever the operator picks a template (or switches language while a
  // template is active), re-fetch the interpolated subject + body and
  // populate the fields. They're still editable after that. All setState
  // calls live inside the async callback so the react-hooks/set-state-in-
  // effect lint rule stays happy.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      if (templateSlug === FREE_FORM_SLUG) {
        // Free-form: clear the template-derived reply-to but leave any
        // partial draft the operator already typed alone.
        if (!cancelled) setReplyTo(null);
        return;
      }
      if (!cancelled) setLoadingTemplate(true);
      const res = await getOutreachTemplateForContact(
        templateSlug,
        contactId,
        language
      );
      if (cancelled) return;
      if ("error" in res) {
        setMsg({ type: "err", text: res.error });
        setLoadingTemplate(false);
        return;
      }
      setSubject(res.subject);
      setBody(res.body);
      setReplyTo(res.replyTo);
      setMsg(null);
      setLoadingTemplate(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, templateSlug, language, contactId]);

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await sendContactMessage({
        contactId,
        subject,
        body,
        locale: language,
        replyTo: replyTo ?? undefined,
        templateSlug: templateSlug === FREE_FORM_SLUG ? null : templateSlug,
      });
      if ("error" in res && res.error) {
        setMsg({ type: "err", text: res.error });
      } else {
        const timeLabel = new Date().toLocaleTimeString(localeKey, {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSentInfo({ email: contactEmail, timeLabel });
        setSubject("");
        setBody("");
        setReplyTo(null);
        setTemplateSlug(FREE_FORM_SLUG);
      }
    });
  }

  function resetForAnother() {
    setSentInfo(null);
    setMsg(null);
  }

  function closeDialog() {
    setOpen(false);
    setSentInfo(null);
    setMsg(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        {t("openButton")}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onClick={() => !isPending && closeDialog()}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {sentInfo ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border-l-4 border-success bg-success-soft/40 p-4">
              <span className="text-2xl leading-none">✓</span>
              <p className="text-sm text-foreground">
                {t("sentAtBody", {
                  email: sentInfo.email,
                  time: sentInfo.timeLabel,
                })}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForAnother}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                {t("sendAnother")}
              </button>
              <Button type="button" onClick={closeDialog}>
                {t("close")}
              </Button>
            </div>
          </div>
        ) : (
          <>
        <h2 className="font-heading text-lg font-bold">{t("title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.rich("recipient", {
            email: contactEmail,
            mono: (chunks) => (
              <span className="font-mono">{chunks}</span>
            ),
          })}
        </p>

        {/* Template + language pickers */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("template")}
            </label>
            <select
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
              disabled={isPending || loadingTemplate}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={FREE_FORM_SLUG}>{t("freeForm")}</option>
              {templates.map((tmpl) => (
                <option key={tmpl.slug} value={tmpl.slug}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Locale)}
              disabled={isPending || loadingTemplate}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {tLocale(l)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("subject")}
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loadingTemplate}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("message")}
            </label>
            <textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loadingTemplate}
              placeholder={t("bodyPlaceholder")}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("bodyHint")}
            </p>
          </div>

          {/* Reply-To chip — read-only badge so the operator can see where
              replies will land. Only appears when a template is active. */}
          {replyTo && (
            <p className="text-xs text-muted-foreground">
              {t("replyToLabel")}:{" "}
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">
                {replyTo}
              </span>
            </p>
          )}

          {msg && (
            <p className="text-sm text-danger">{msg.text}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={closeDialog}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              {t("cancel")}
            </button>
            <Button
              type="button"
              disabled={
                isPending ||
                loadingTemplate ||
                !subject.trim() ||
                !body.trim()
              }
              onClick={submit}
            >
              {isPending ? t("sending") : t("send")}
            </Button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
