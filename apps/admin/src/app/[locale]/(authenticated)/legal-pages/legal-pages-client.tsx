"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@dbc/ui";
import {
  TEMPLATE_VARIABLES,
  type LegalDocumentType,
  type LegalLocale,
  type PublicCompanyInfo,
} from "@dbc/legal/client";
import {
  saveLegalDraft,
  publishLegalPage,
  restoreLegalDefault,
} from "@/actions/legal-pages";
import { renderPreview } from "./preview-action";

interface LegalRow {
  document_type: string;
  locale: string;
  title: string;
  body_markdown: string;
  published_title: string | null;
  published_body_markdown: string | null;
  published_at: string | null;
  draft_updated_at: string;
}

interface DocType {
  type: LegalDocumentType;
  label: { en: string; de: string; fr: string };
}

const T = {
  en: {
    locale: "Language",
    title: "Title",
    body: "Body (Markdown)",
    save: "Save draft",
    saving: "Saving…",
    publish: "Publish",
    publishing: "Publishing…",
    restore: "Restore default",
    restoreConfirm: "Restore the JSX-based default?",
    restoreConfirmDesc:
      "This wipes the DB row entirely. The public site will re-render the original code-defined component until you save again.",
    cancel: "Cancel",
    preview: "Preview",
    placeholders: "Available placeholders",
    drafted: "Last draft saved",
    published: "Last published",
    never: "never",
    notPublishedYet: "Not yet published — public site renders the code default.",
    publishedShown: "This version is currently live on the public site.",
    draftAhead:
      "You have unpublished draft changes — click Publish to push them live.",
    saveOk: "Draft saved.",
    publishOk: "Published live.",
    restoreOk: "Restored to code default.",
    fillBody: "Body cannot be empty before publishing.",
  },
  de: {
    locale: "Sprache",
    title: "Titel",
    body: "Inhalt (Markdown)",
    save: "Entwurf speichern",
    saving: "Wird gespeichert…",
    publish: "Veröffentlichen",
    publishing: "Wird veröffentlicht…",
    restore: "Standard wiederherstellen",
    restoreConfirm: "JSX-Standard wiederherstellen?",
    restoreConfirmDesc:
      "Damit wird die Datenbankzeile geleert. Die öffentliche Seite zeigt die ursprüngliche Code-Komponente, bis Sie wieder speichern.",
    cancel: "Abbrechen",
    preview: "Vorschau",
    placeholders: "Verfügbare Platzhalter",
    drafted: "Entwurf zuletzt gespeichert",
    published: "Zuletzt veröffentlicht",
    never: "nie",
    notPublishedYet:
      "Noch nicht veröffentlicht — die öffentliche Seite zeigt den Code-Standard.",
    publishedShown: "Diese Version ist aktuell live.",
    draftAhead:
      "Es gibt unveröffentlichte Änderungen — klicken Sie auf Veröffentlichen.",
    saveOk: "Entwurf gespeichert.",
    publishOk: "Veröffentlicht.",
    restoreOk: "Standard wiederhergestellt.",
    fillBody:
      "Der Inhalt darf vor dem Veröffentlichen nicht leer sein.",
  },
  fr: {
    locale: "Langue",
    title: "Titre",
    body: "Contenu (Markdown)",
    save: "Enregistrer le brouillon",
    saving: "Enregistrement…",
    publish: "Publier",
    publishing: "Publication…",
    restore: "Restaurer le défaut",
    restoreConfirm: "Restaurer le défaut JSX ?",
    restoreConfirmDesc:
      "Cela vide la ligne de la base. Le site public affichera le composant d'origine jusqu'à ce que vous enregistriez à nouveau.",
    cancel: "Annuler",
    preview: "Aperçu",
    placeholders: "Variables disponibles",
    drafted: "Dernier brouillon enregistré",
    published: "Dernière publication",
    never: "jamais",
    notPublishedYet:
      "Non publié — le site public affiche le défaut du code.",
    publishedShown: "Cette version est actuellement en ligne.",
    draftAhead:
      "Modifications non publiées — cliquez sur Publier pour les diffuser.",
    saveOk: "Brouillon enregistré.",
    publishOk: "Publié.",
    restoreOk: "Défaut restauré.",
    fillBody: "Le contenu ne peut pas être vide avant la publication.",
  },
} as const;

const LOCALES: LegalLocale[] = ["en", "de", "fr"];

export function LegalPagesClient({
  rows,
  documentTypes,
  uiLocale,
  company,
}: {
  rows: LegalRow[];
  documentTypes: ReadonlyArray<DocType>;
  uiLocale: LegalLocale;
  company: PublicCompanyInfo | null;
}) {
  const t = T[uiLocale];
  const [activeDoc, setActiveDoc] = useState<LegalDocumentType>(
    documentTypes[0].type
  );
  const [activeLocale, setActiveLocale] = useState<LegalLocale>(uiLocale);

  const rowMap = useMemo(() => {
    const m = new Map<string, LegalRow>();
    for (const r of rows) m.set(`${r.document_type}:${r.locale}`, r);
    return m;
  }, [rows]);

  const currentKey = `${activeDoc}:${activeLocale}`;
  const current = rowMap.get(currentKey);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-border">
        <div className="flex gap-1 p-1">
          {documentTypes.map((d) => (
            <button
              key={d.type}
              type="button"
              onClick={() => setActiveDoc(d.type)}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                activeDoc === d.type
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {d.label[uiLocale]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setActiveLocale(l)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium uppercase ${
              activeLocale === l
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {current && (
        <LegalEditor
          key={currentKey}
          row={current}
          docType={activeDoc}
          locale={activeLocale}
          uiLocale={uiLocale}
          t={t}
          company={company}
        />
      )}
    </div>
  );
}

function LegalEditor({
  row,
  docType,
  locale,
  uiLocale,
  t,
  company,
}: {
  row: LegalRow;
  docType: LegalDocumentType;
  locale: LegalLocale;
  uiLocale: LegalLocale;
  t: (typeof T)[keyof typeof T];
  company: PublicCompanyInfo | null;
}) {
  const [title, setTitle] = useState(row.title || "");
  const [body, setBody] = useState(row.body_markdown || "");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const [isRestoring, startRestore] = useTransition();
  const [isPreviewing, startPreview] = useTransition();

  function handleSave() {
    setFeedback(null);
    startSave(async () => {
      const r = await saveLegalDraft({
        documentType: docType,
        locale,
        title,
        body_markdown: body,
      });
      if ("error" in r && r.error) setFeedback(r.error);
      else setFeedback(t.saveOk);
    });
  }

  function handlePublish() {
    if (!body.trim()) {
      setFeedback(t.fillBody);
      return;
    }
    setFeedback(null);
    startPublish(async () => {
      const saveRes = await saveLegalDraft({
        documentType: docType,
        locale,
        title,
        body_markdown: body,
      });
      if ("error" in saveRes && saveRes.error) {
        setFeedback(saveRes.error);
        return;
      }
      const r = await publishLegalPage({ documentType: docType, locale });
      if ("error" in r && r.error) setFeedback(r.error);
      else setFeedback(t.publishOk);
    });
  }

  function handleRestore() {
    setFeedback(null);
    startRestore(async () => {
      const r = await restoreLegalDefault({ documentType: docType, locale });
      if ("error" in r && r.error) {
        setFeedback(r.error);
        return;
      }
      setTitle("");
      setBody("");
      setPreviewHtml("");
      setFeedback(t.restoreOk);
    });
  }

  function handlePreview() {
    startPreview(async () => {
      const html = await renderPreview({
        body_markdown: body,
        locale,
      });
      setPreviewHtml(html);
    });
  }

  const draftAhead =
    body.trim() !== (row.published_body_markdown ?? "").trim() ||
    title.trim() !== (row.published_title ?? "").trim();

  function fmt(iso: string | null) {
    if (!iso) return t.never;
    return new Date(iso).toLocaleString(uiLocale);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border p-3 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>{t.drafted}:</strong> {fmt(row.draft_updated_at)}
        </p>
        <p>
          <strong>{t.published}:</strong> {fmt(row.published_at)}
        </p>
        {!row.published_body_markdown && (
          <p className="text-yellow-700 dark:text-yellow-400">
            {t.notPublishedYet}
          </p>
        )}
        {row.published_body_markdown && draftAhead && (
          <p className="text-yellow-700 dark:text-yellow-400">
            {t.draftAhead}
          </p>
        )}
        {row.published_body_markdown && !draftAhead && (
          <p className="text-green-700 dark:text-green-400">
            {t.publishedShown}
          </p>
        )}
      </div>

      <label className="block">
        <span className="block text-xs font-medium">{t.title}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-medium">{t.body}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={28}
            spellCheck
            className="mt-1 w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
          />
        </label>
        <div className="block">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-medium">{t.preview}</span>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
            >
              {isPreviewing ? "…" : "↻"}
            </button>
          </div>
          <div
            className="prose prose-sm dark:prose-invert mt-1 h-[420px] overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <details className="rounded-md border border-border p-3 text-xs">
        <summary className="cursor-pointer font-medium">
          {t.placeholders} ({TEMPLATE_VARIABLES.length})
        </summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setBody(body + `{{${v.key}}}`)}
              className="rounded border border-border bg-background px-2 py-1 text-left font-mono text-[11px] hover:bg-muted"
              title={v.description}
            >
              {`{{${v.key}}}`}
              <div className="font-sans text-[10px] text-muted-foreground">
                {v.description}
              </div>
            </button>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isPublishing}
        >
          {isSaving ? t.saving : t.save}
        </Button>
        <Button
          type="button"
          onClick={handlePublish}
          disabled={isSaving || isPublishing || !body.trim()}
        >
          {isPublishing ? t.publishing : t.publish}
        </Button>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              disabled={isRestoring}
              className="rounded-md border border-input px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
            >
              {t.restore}
            </button>
          }
          title={t.restoreConfirm}
          description={t.restoreConfirmDesc}
          confirmLabel={t.restore}
          cancelLabel={t.cancel}
          variant="danger"
          onConfirm={handleRestore}
        />
      </div>

      {feedback && (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      )}

      {/* Quiet reference to company info — we don't render it, but pinning
          it in the closure prevents unused-var lint and signals to the
          reader that the editor is aware of the data source for the
          {{template}} placeholders. */}
      <span className="hidden">
        {company?.legal_name ?? ""}
      </span>
    </div>
  );
}
