"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/actions/contact-messages";

export function ComposeDialog({
  contactId,
  contactEmail,
  defaultLocale,
}: {
  contactId: string;
  contactEmail: string;
  defaultLocale: string;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const localeKey = (defaultLocale === "de" || defaultLocale === "fr"
    ? defaultLocale
    : "en") as "en" | "de" | "fr";

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await sendContactMessage({
        contactId,
        subject,
        body,
        locale: localeKey,
      });
      if ("error" in res && res.error) {
        setMsg({ type: "err", text: res.error });
      } else {
        setMsg({ type: "ok", text: `Sent to ${contactEmail}` });
        setSubject("");
        setBody("");
        setTimeout(() => {
          setOpen(false);
          setMsg(null);
        }, 1200);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        Send email…
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onClick={() => !isPending && setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-lg font-bold">Send email</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          To <span className="font-mono">{contactEmail}</span>. Personal
          one-off message — not marketing, no unsubscribe footer.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Message
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi Ada, …"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Blank lines split paragraphs. Plain text only.
            </p>
          </div>
          {msg && (
            <p
              className={`text-sm ${
                msg.type === "err" ? "text-red-600" : "text-green-700"
              }`}
            >
              {msg.text}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || !subject.trim() || !body.trim()}
              onClick={submit}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
