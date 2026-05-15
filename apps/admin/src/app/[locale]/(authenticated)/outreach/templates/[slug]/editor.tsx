"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ConfirmDialog, FormField, Input, Textarea } from "@dbc/ui";
import { toast } from "sonner";
import {
  deleteOutreachTemplate,
  upsertOutreachTemplate,
  type OutreachTemplateRow,
} from "@/actions/outreach-templates";

const LOCALES = ["en", "de", "fr"] as const;
type Locale = (typeof LOCALES)[number];

// Same variable set the server-side interpolator supports. Documented inline
// so the editor surface is self-explanatory.
const VARIABLES: Array<{ token: string; example: string }> = [
  { token: "{firstName}", example: "Ada" },
  { token: "{lastName}", example: "Lovelace" },
  { token: "{fullName}", example: "Ada Lovelace" },
  { token: "{organization}", example: "Analytical Engine Co." },
  { token: "{country}", example: "United Kingdom" },
  { token: "{sector}", example: "Tech / AI" },
  { token: "{tier}", example: "Tier 1" },
  { token: "{pitchTier}", example: "Gold" },
  { token: "{eventTitle}", example: "Richesses d'Afrique Germany 2026" },
  { token: "{eventDate}", example: "13 June 2026" },
  { token: "{eventCity}", example: "Essen" },
  { token: "{eventVenue}", example: "Messe Essen" },
  {
    token: "{eventUrl}",
    example: "https://tickets.dbc-germany.com/en/events/richesses-dafrique-germany-2026",
  },
  { token: "{senderName}", example: "Jay Kalala" },
  { token: "{senderEmail}", example: "jay@dbc-germany.com" },
  { token: "{senderRole}", example: "admin" },
  { token: "{ticketsUrl}", example: "https://tickets.dbc-germany.com" },
  { token: "{sponsorDeckUrl}", example: "https://dbc-germany.com/sponsors" },
  { token: "{pressKitUrl}", example: "https://dbc-germany.com/press" },
];

export function OutreachTemplateEditor({
  template,
  locale,
  mode = "edit",
}: {
  template: OutreachTemplateRow;
  locale: string;
  /** "create" enables the slug input and routes to the new template's page after save.
   *  "edit" keeps the slug read-only and shows the Delete action for non-system rows. */
  mode?: "create" | "edit";
}) {
  const t = useTranslations("admin.outreach.editor");
  const tLocale = useTranslations("admin.outreach.locales");
  const router = useRouter();

  const [slug, setSlug] = useState(template.slug);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [replyTo, setReplyTo] = useState(template.reply_to);
  const [subjects, setSubjects] = useState<Record<Locale, string>>({
    en: template.subject_en,
    de: template.subject_de,
    fr: template.subject_fr,
  });
  const [bodies, setBodies] = useState<Record<Locale, string>>({
    en: template.body_en,
    de: template.body_de,
    fr: template.body_fr,
  });
  // Default tab to the admin's current UI locale.
  const initialTab = (locale === "de" || locale === "fr"
    ? locale
    : "en") as Locale;
  const [activeTab, setActiveTab] = useState<Locale>(initialTab);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await upsertOutreachTemplate({
        slug: mode === "create" ? slug.trim() : template.slug,
        name,
        description: description || null,
        reply_to: replyTo,
        subject_en: subjects.en,
        subject_de: subjects.de,
        subject_fr: subjects.fr,
        body_en: bodies.en,
        body_de: bodies.de,
        body_fr: bodies.fr,
        sort_order: template.sort_order,
      });
      if ("error" in res) {
        setMsg({ type: "err", text: res.error });
      } else if (mode === "create") {
        // Land the operator on the edit page of the just-created template so
        // they can iterate on copy without re-typing the slug.
        router.push(`/${locale}/outreach/templates/${slug.trim()}`);
        router.refresh();
      } else {
        setMsg({ type: "ok", text: t("saved") });
      }
    });
  }

  async function handleDelete() {
    const res = await deleteOutreachTemplate(template.slug);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("deleted"));
    router.push(`/${locale}/outreach/templates`);
    router.refresh();
  }

  return (
    <div className="mt-6 max-w-3xl space-y-6">
      {/* Meta — slug (create-only), name + description + reply-to live above
          the locale tabs since they're shared across every locale. */}
      <div className="space-y-4 rounded-lg border border-border p-4">
        {mode === "create" && (
          <FormField label={t("fieldSlug")} hint={t("fieldSlugHint")} required>
            <Input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]+/g, "_")
                    .replace(/^_+|_+$/g, "")
                )
              }
              placeholder="vip_followup"
              autoComplete="off"
            />
          </FormField>
        )}
        <FormField label={t("fieldName")} required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label={t("fieldDescription")}>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField
          label={t("fieldReplyTo")}
          hint={t("fieldReplyToHint")}
          required
        >
          <Input
            type="email"
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            autoComplete="off"
          />
        </FormField>
      </div>

      {/* Locale tabs */}
      <div>
        <div className="flex gap-1 rounded-md border border-border p-1 w-fit">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setActiveTab(l)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tLocale(l)}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4 rounded-lg border border-border p-4">
          <FormField label={t("fieldSubject")} required>
            <Input
              type="text"
              value={subjects[activeTab]}
              onChange={(e) =>
                setSubjects((s) => ({ ...s, [activeTab]: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t("fieldBody")} required>
            <Textarea
              rows={18}
              value={bodies[activeTab]}
              onChange={(e) =>
                setBodies((b) => ({ ...b, [activeTab]: e.target.value }))
              }
              className="font-mono"
            />
          </FormField>
        </div>
      </div>

      {/* Variables cheatsheet */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold">{t("variables")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("variablesHint")}
        </p>
        <div className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
          {VARIABLES.map((v) => (
            <div key={v.token} className="flex items-baseline gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {v.token}
              </code>
              <span className="text-muted-foreground">→ {v.example}</span>
            </div>
          ))}
        </div>
      </div>

      {msg && (
        <p
          className={`text-sm ${
            msg.type === "err" ? "text-danger" : "text-success"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {mode === "edit" && !template.is_system && (
          <ConfirmDialog
            trigger={
              <button
                type="button"
                className="text-xs text-danger hover:opacity-80"
              >
                {t("delete")}
              </button>
            }
            title={t("delete")}
            description={t("deleteConfirm", { name: template.name })}
            variant="danger"
            confirmLabel={t("delete")}
            onConfirm={handleDelete}
          />
        )}
        <Button
          type="button"
          disabled={isPending || (mode === "create" && !slug.trim())}
          onClick={save}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
