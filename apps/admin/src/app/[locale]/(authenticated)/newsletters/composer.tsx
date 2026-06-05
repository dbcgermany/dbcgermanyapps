"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, ConfirmDialog, Input, Select } from "@dbc/ui";
import type { DomainCheckResult } from "@dbc/email";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  saveNewsletter,
  previewNewsletterRecipientCount,
  sendTestNewsletter,
  sendNewsletter,
} from "@/actions/newsletters";

interface Category {
  slug: string;
  name: string;
}

interface ComposerState {
  id?: string;
  subject: string;
  preheader: string;
  body_mdx: string;
  body_html: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  locale: string;
  target_category_slugs: string[];
  exclude_category_slugs: string[];
}

const DEFAULT: ComposerState = {
  subject: "",
  preheader: "",
  body_mdx: "",
  body_html: "",
  from_name: "DBC Germany",
  from_email: "newsletter@dbc-germany.com",
  reply_to: "info@dbc-germany.com",
  locale: "en",
  target_category_slugs: [],
  exclude_category_slugs: [],
};

export function NewsletterComposer({
  uiLocale: _uiLocale = "en",
  categories,
  initial,
  readOnly = false,
  domainStatus,
  companyFooter,
}: {
  uiLocale?: string;
  categories: Category[];
  initial?: ComposerState;
  readOnly?: boolean;
  domainStatus?: DomainCheckResult;
  companyFooter: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin.newsletters.composer");
  const [state, setState] = useState<ComposerState>(initial ?? DEFAULT);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ComposerState>(k: K, v: ComposerState[K]) {
    setState({ ...state, [k]: v });
  }

  function toggleTarget(slug: string) {
    setState({
      ...state,
      target_category_slugs: state.target_category_slugs.includes(slug)
        ? state.target_category_slugs.filter((s) => s !== slug)
        : [...state.target_category_slugs, slug],
    });
  }
  function toggleExclude(slug: string) {
    setState({
      ...state,
      exclude_category_slugs: state.exclude_category_slugs.includes(slug)
        ? state.exclude_category_slugs.filter((s) => s !== slug)
        : [...state.exclude_category_slugs, slug],
    });
  }

  function handleSave(after?: (id: string) => void) {
    setMsg(null);
    startTransition(async () => {
      const res = await saveNewsletter(state);
      if ("error" in res && res.error) {
        setMsg({ type: "err", text: res.error });
      } else if ("success" in res) {
        setMsg({ type: "ok", text: t("saved") });
        setState({ ...state, id: res.id });
        after?.(res.id);
      }
    });
  }

  function handlePreviewRecipients() {
    startTransition(async () => {
      const n = await previewNewsletterRecipientCount(
        state.target_category_slugs,
        state.exclude_category_slugs
      );
      setRecipientCount(n);
    });
  }

  function handleSendTest() {
    if (!state.id || !testEmail) {
      setMsg({ type: "err", text: t("saveFirst") });
      return;
    }
    startTransition(async () => {
      const res = await sendTestNewsletter(state.id!, testEmail);
      if ("error" in res && res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: t("testSent", { email: testEmail }) });
    });
  }

  function handleSendReal() {
    if (!state.id) {
      setMsg({ type: "err", text: t("saveFirstPlain") });
      return;
    }
    // Confirmation now lives in the surrounding ConfirmDialog — this fn is
    // only invoked once the operator has explicitly confirmed.
    startTransition(async () => {
      const res = await sendNewsletter(state.id!);
      if ("error" in res && res.error) {
        setMsg({ type: "err", text: res.error });
      } else if ("success" in res) {
        setMsg({
          type: "ok",
          text: t("sentReport", { s: String(res.sent ?? 0), f: String(res.failed ?? 0) }),
        });
        router.refresh();
      }
    });
  }

  const domainUnverified = Boolean(domainStatus && !domainStatus.verified);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
      {domainUnverified && (
        <div
          role="alert"
          className="lg:col-span-2 rounded-lg border border-warning-border bg-warning-soft p-4 text-sm text-warning"
        >
          <p className="font-semibold">{t("domainUnverifiedTitle")}</p>
          <p className="mt-1 leading-relaxed">{t("domainUnverifiedBody")}</p>
          {domainStatus?.message && (
            <p className="mt-2 font-mono text-xs opacity-80">
              Resend: {domainStatus.message}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        <fieldset disabled={readOnly} className="space-y-4">
          <Field label={t("subject")} required>
            <Input
              value={state.subject}
              onChange={(e) => update("subject", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t("preheader")}>
            <Input
              value={state.preheader}
              onChange={(e) => update("preheader", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("fromName")}>
              <Input
                value={state.from_name}
                onChange={(e) => update("from_name", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label={t("fromEmail")}>
              <Input
                value={state.from_email}
                onChange={(e) => update("from_email", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label={t("replyTo")}>
              <Input
                value={state.reply_to}
                onChange={(e) => update("reply_to", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label={t("localeLabel")}>
            <Select
              value={state.locale}
              onChange={(e) => update("locale", e.target.value)}
              className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="en">en</option>
              <option value="de">de</option>
              <option value="fr">fr</option>
              <option value="multi">multi</option>
            </Select>
          </Field>
          <Field label={t("bodyLabel")}>
            <RichTextEditor
              defaultValue={state.body_html}
              locale={
                state.locale === "de" || state.locale === "fr"
                  ? state.locale
                  : "en"
              }
              onChange={(html) => update("body_html", html)}
            />
          </Field>
          {/* Inline preview — visual sanity check while editing. Pixel-
              perfect render still goes through the existing "Send test"
              button (real email path through the React Email template). */}
          {(state.body_html || state.body_mdx).trim() && (
            <Field label="Preview">
              <div className="rounded-md border border-border bg-muted/20 p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Subject
                </p>
                <p className="font-semibold">{state.subject || "(no subject)"}</p>
                {state.preheader && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {state.preheader}
                  </p>
                )}
                <hr className="my-3 border-border" />
                {state.body_html ? (
                  <div
                    className="prose prose-sm prose-neutral max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: state.body_html }}
                  />
                ) : (
                  <div
                    className="whitespace-pre-wrap leading-relaxed"
                    style={{
                      fontFamily:
                        "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                    }}
                  >
                    {state.body_mdx}
                  </div>
                )}
                <hr className="my-3 border-border" />
                <p className="text-xs text-muted-foreground">{companyFooter}</p>
              </div>
            </Field>
          )}
        </fieldset>

        {!readOnly && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isPending}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {t("saveDraft")}
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card padding="sm">
          <p className="text-sm font-semibold">{t("targeting")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("targetingHint")}
          </p>
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide">
              {t("include")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <label
                  key={`inc-${c.slug}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <Input
                    type="checkbox"
                    disabled={readOnly}
                    checked={state.target_category_slugs.includes(c.slug)}
                    onChange={() => toggleTarget(c.slug)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide">
              {t("exclude")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <label
                  key={`exc-${c.slug}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <Input
                    type="checkbox"
                    disabled={readOnly}
                    checked={state.exclude_category_slugs.includes(c.slug)}
                    onChange={() => toggleExclude(c.slug)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handlePreviewRecipients}
            disabled={isPending}
            className="mt-4 text-sm font-medium text-primary hover:opacity-80"
          >
            {t("previewCount")}
          </button>
          {recipientCount !== null && (
            <p className="mt-2 text-sm">
              <strong>{recipientCount}</strong>{" "}
              {recipientCount === 1 ? t("willReceive1") : t("willReceiveMany")}
            </p>
          )}
        </Card>

        {!readOnly && (
          <Card padding="sm">
            <p className="text-sm font-semibold">{t("sendTest")}</p>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={t("testPh")}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isPending}
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {t("sendTestBtn")}
            </button>
          </Card>
        )}

        {!readOnly && (
          <div className="rounded-lg border border-danger-border bg-danger-soft p-4">
            <p className="text-sm font-semibold text-danger">
              {t("sendBroadcast")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("sendBroadcastHint")}
            </p>
            <ConfirmDialog
              trigger={
                <button
                  type="button"
                  disabled={isPending || !state.id || domainUnverified}
                  className="mt-2 w-full rounded-md bg-danger-strong px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {t("sendNow")}
                </button>
              }
              title={t("confirmSend", {
                n: String(recipientCount ?? 0),
                s: (recipientCount ?? 0) === 1 ? "" : "s",
              })}
              confirmLabel={t("sendNow")}
              cancelLabel={t("cancel")}
              variant="danger"
              onConfirm={handleSendReal}
            />
          </div>
        )}

        {msg && (
          <p
            className={`text-sm ${
              msg.type === "err" ? "text-danger" : "text-success"
            }`}
          >
            {msg.text}
          </p>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
