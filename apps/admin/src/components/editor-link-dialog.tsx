"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Editor } from "@tiptap/react";
import { Button, Input } from "@dbc/ui";
import { getLinkSuggestions } from "@/actions/news";

type Suggestion = { label: string; slug: string; group: string };
const GROUPS = ["pillar", "siblings", "clusters", "category", "recent"] as const;

/**
 * WordPress-style link tool: paste an external URL, or pick an internal
 * article from grouped suggestions (this pillar / sibling + cluster articles /
 * same category / recent). Inserts the link on the editor's current selection.
 */
export function EditorLinkDialog({
  editor,
  postId,
  locale,
  onClose,
}: {
  editor: Editor;
  postId?: string;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("admin.news.editor");
  const [url, setUrl] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    let active = true;
    getLinkSuggestions(postId).then((s) => active && setSuggestions(s));
    return () => {
      active = false;
    };
  }, [postId]);

  function insertExternal() {
    const v = url.trim();
    if (!v) return;
    const external = /^https?:\/\//.test(v);
    editor
      .chain()
      .focus()
      .setLink({
        href: v,
        target: external ? "_blank" : null,
        rel: external ? "noopener noreferrer" : null,
      })
      .run();
    onClose();
  }

  function insertInternal(slug: string) {
    editor
      .chain()
      .focus()
      .setLink({ href: `/${locale}/news/${slug}`, target: null, rel: null })
      .run();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold">{t("linkPickerTitle")}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("linkExternalUrl")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertExternal();
              }
            }}
          />
          <Button type="button" onClick={insertExternal}>
            {t("linkInsert")}
          </Button>
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto">
          {GROUPS.map((g) => {
            const items = suggestions.filter((s) => s.group === g);
            if (items.length === 0) return null;
            return (
              <div key={g} className="mt-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(`linkGroups.${g}`)}
                </p>
                {items.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => insertInternal(s.slug)}
                    className="block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
