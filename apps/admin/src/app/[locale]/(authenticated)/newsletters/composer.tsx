"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  from_name: "DBC Germany",
  from_email: "newsletter@dbc-germany.com",
  reply_to: "info@dbc-germany.com",
  locale: "en",
  target_category_slugs: [],
  exclude_category_slugs: [],
};

export function NewsletterComposer({
  categories,
  initial,
  readOnly = false,
}: {
  categories: Category[];
  initial?: ComposerState;
  readOnly?: boolean;
}) {
  const router = useRouter();
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
        setMsg({ type: "ok", text: "Saved." });
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
      setMsg({ type: "err", text: "Save the draft first, then enter a test email." });
      return;
    }
    startTransition(async () => {
      const res = await sendTestNewsletter(state.id!, testEmail);
      if ("error" in res && res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: `Test sent to ${testEmail}` });
    });
  }

  function handleSendReal() {
    if (!state.id) {
      setMsg({ type: "err", text: "Save the draft first." });
      return;
    }
    const n = recipientCount ?? 0;
    if (!confirm(`Send to ${n} recipient${n === 1 ? "" : "s"}? This cannot be undone.`))
      return;
    startTransition(async () => {
      const res = await sendNewsletter(state.id!);
      if ("error" in res && res.error) {
        setMsg({ type: "err", text: res.error });
      } else if ("success" in res) {
        setMsg({
          type: "ok",
          text: `Sent: ${res.sent ?? 0}, failed: ${res.failed ?? 0}.`,
        });
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <fieldset disabled={readOnly} className="space-y-4">
          <Field label="Subject" required>
            <input
              value={state.subject}
              onChange={(e) => update("subject", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Preheader (preview text)">
            <input
              value={state.preheader}
              onChange={(e) => update("preheader", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="From name">
              <input
                value={state.from_name}
                onChange={(e) => update("from_name", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="From email">
              <input
                value={state.from_email}
                onChange={(e) => update("from_email", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Reply-to">
              <input
                value={state.reply_to}
                onChange={(e) => update("reply_to", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Locale">
            <select
              value={state.locale}
              onChange={(e) => update("locale", e.target.value)}
              className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="en">en</option>
              <option value="de">de</option>
              <option value="fr">fr</option>
              <option value="multi">multi</option>
            </select>
          </Field>
          <Field label="Body (plain text; blank lines split paragraphs)">
            <textarea
              rows={14}
              value={state.body_mdx}
              onChange={(e) => update("body_mdx", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </Field>
        </fieldset>

        {!readOnly && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isPending}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-semibold">Targeting</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Include — at least one tag must match. Exclude — skip if any match.
            No includes = everyone with marketing consent.
          </p>
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide">
              Include
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <label
                  key={`inc-${c.slug}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <input
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
              Exclude
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <label
                  key={`exc-${c.slug}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <input
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
            Preview recipient count
          </button>
          {recipientCount !== null && (
            <p className="mt-2 text-sm">
              <strong>{recipientCount}</strong> contact
              {recipientCount === 1 ? "" : "s"} will receive this.
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold">Send test</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isPending}
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Send test email
            </button>
          </div>
        )}

        {!readOnly && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:bg-red-900/10">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Send broadcast
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              One-way. Saves the draft first, then dispatches to the resolved
              recipient list.
            </p>
            <button
              type="button"
              onClick={handleSendReal}
              disabled={isPending || !state.id}
              className="mt-2 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Send now
            </button>
          </div>
        )}

        {msg && (
          <p
            className={`text-sm ${
              msg.type === "err" ? "text-red-600" : "text-green-700"
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
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
