"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@dbc/supabase";
import {
  sendContactMessage,
  createContactMessageAttachmentUploadUrl,
  deleteContactMessageAttachment,
} from "@/actions/contact-messages";
import {
  getOutreachTemplateForContact,
  type OutreachTemplateSummary,
} from "@/actions/outreach-templates";
import { Button, Input, Select, Textarea } from "@dbc/ui";

const FREE_FORM_SLUG = "__free__";
const LOCALES = ["en", "de", "fr"] as const;
type Locale = (typeof LOCALES)[number];

// Resend caps a single email at 40 MB total. Each file is also individually
// capped at 40 MB; we additionally surface a soft warning above 25 MB because
// many recipient MTAs (Outlook, corporate Gmail) silently drop messages
// larger than that.
const ATTACHMENT_BUCKET = "contact-mail-attachments";
const PER_FILE_MAX_BYTES = 40 * 1024 * 1024;
const TOTAL_MAX_BYTES = 40 * 1024 * 1024;
const SOFT_WARN_BYTES = 25 * 1024 * 1024;

type PendingAttachment = {
  /** Stable client-side id so React can key the list during upload. */
  clientId: string;
  filename: string;
  sizeBytes: number;
  contentType: string;
  status: "uploading" | "ready" | "error";
  path?: string;
  error?: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

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
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Reads the picked files and uploads them in parallel to the private
  // Supabase bucket. We add a placeholder row to the list immediately so the
  // operator can see the file is being handled, then flip its status to
  // "ready" with the storage path once the upload returns.
  function pickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMsg(null);

    const currentTotal = attachments
      .filter((a) => a.status !== "error")
      .reduce((n, a) => n + a.sizeBytes, 0);

    const fileArr = Array.from(files);
    let runningTotal = currentTotal;
    const toAdd: PendingAttachment[] = [];
    for (const f of fileArr) {
      if (f.size > PER_FILE_MAX_BYTES) {
        toAdd.push({
          clientId: crypto.randomUUID(),
          filename: f.name,
          sizeBytes: f.size,
          contentType: f.type || "application/octet-stream",
          status: "error",
          error: t("attachmentTooLarge"),
        });
        continue;
      }
      if (runningTotal + f.size > TOTAL_MAX_BYTES) {
        toAdd.push({
          clientId: crypto.randomUUID(),
          filename: f.name,
          sizeBytes: f.size,
          contentType: f.type || "application/octet-stream",
          status: "error",
          error: t("attachmentTotalTooLarge"),
        });
        continue;
      }
      runningTotal += f.size;
      const clientId = crypto.randomUUID();
      toAdd.push({
        clientId,
        filename: f.name,
        sizeBytes: f.size,
        contentType: f.type || "application/octet-stream",
        status: "uploading",
      });
      void uploadOne(clientId, f);
    }
    setAttachments((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadOne(clientId: string, file: File) {
    try {
      const sig = await createContactMessageAttachmentUploadUrl({
        contactId,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      if (!("success" in sig) || !sig.success) {
        throw new Error(("error" in sig && sig.error) || "Upload failed");
      }
      const supabase = createBrowserClient();
      const { error } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .uploadToSignedUrl(sig.path, sig.token, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (error) throw new Error(error.message);
      setAttachments((prev) =>
        prev.map((a) =>
          a.clientId === clientId
            ? { ...a, status: "ready", path: sig.path }
            : a
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setAttachments((prev) =>
        prev.map((a) =>
          a.clientId === clientId
            ? { ...a, status: "error", error: message }
            : a
        )
      );
    }
  }

  async function removeAttachment(clientId: string) {
    const target = attachments.find((a) => a.clientId === clientId);
    setAttachments((prev) => prev.filter((a) => a.clientId !== clientId));
    if (target?.path && target.status === "ready") {
      // Best-effort cleanup; ignore the result, the bucket isn't growing fast.
      await deleteContactMessageAttachment(target.path);
    }
  }

  function submit() {
    setMsg(null);
    const ready = attachments.filter((a) => a.status === "ready" && a.path);
    const stillUploading = attachments.some((a) => a.status === "uploading");
    if (stillUploading) {
      setMsg({ type: "err", text: t("attachmentsStillUploading") });
      return;
    }
    startTransition(async () => {
      const res = await sendContactMessage({
        contactId,
        subject,
        body,
        locale: language,
        replyTo: replyTo ?? undefined,
        templateSlug: templateSlug === FREE_FORM_SLUG ? null : templateSlug,
        attachments: ready.map((a) => ({
          path: a.path!,
          filename: a.filename,
          contentType: a.contentType,
          sizeBytes: a.sizeBytes,
        })),
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
        setAttachments([]);
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
            <Select
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
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("language")}
            </label>
            <Select
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
            </Select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("subject")}
            </label>
            <Input
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
            <Textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loadingTemplate}
              placeholder={t("bodyPlaceholder")}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("bodyHint")}
            </p>
          </div>

          {/* Attachments — multi-file, uploaded directly to private Supabase
              Storage and forwarded by the server action to Resend. */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("attachments")}
            </label>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => pickFiles(e.target.files)}
              disabled={isPending || loadingTemplate}
              className="mt-1 block w-full text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("attachmentsHint")}
            </p>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {attachments.map((a) => (
                  <li
                    key={a.clientId}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs"
                  >
                    <span className="flex-1 truncate">
                      <span className="font-medium">{a.filename}</span>
                      <span className="ml-2 text-muted-foreground">
                        {formatBytes(a.sizeBytes)}
                      </span>
                      {a.status === "uploading" && (
                        <span className="ml-2 text-muted-foreground">
                          · {t("attachmentUploading")}
                        </span>
                      )}
                      {a.status === "error" && (
                        <span className="ml-2 text-danger">· {a.error}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.clientId)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-danger"
                      aria-label={t("attachmentRemove")}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {(() => {
              const total = attachments
                .filter((a) => a.status !== "error")
                .reduce((n, a) => n + a.sizeBytes, 0);
              if (total > SOFT_WARN_BYTES) {
                return (
                  <p className="mt-1 text-xs text-warning" role="alert">
                    {t("attachmentSoftWarn", { sizeMb: (total / 1024 / 1024).toFixed(1) })}
                  </p>
                );
              }
              return null;
            })()}
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
                !body.trim() ||
                attachments.some((a) => a.status === "uploading")
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
