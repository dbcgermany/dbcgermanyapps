"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, FormField, Input, Select } from "@dbc/ui";
import { searchAuthors } from "@/actions/authors";
import { AUTHOR_ROLES } from "@/lib/author-types";
import type {
  AuthorPickKind,
  AuthorSearchResult,
} from "@/lib/post-authors-sync";

export type SelectedAuthor = {
  kind: AuthorPickKind;
  id: string;
  display_name: string;
  role: string;
};

/**
 * Dynamic typeahead author picker. Search authors, add one or more with a
 * role (author / interviewer / interviewee / …). Emits a hidden
 * `author_entries` JSON field consumed by the news create/update actions.
 * Leaving it empty credits DBC Germany (handled server-side).
 */
export function NewsAuthorPicker({ initial = [] }: { initial?: SelectedAuthor[] }) {
  const t = useTranslations("admin.news.editor");
  const [selected, setSelected] = useState<SelectedAuthor[]>(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthorSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    let active = true;
    // All state updates run inside the (async) timeout callback, never
    // synchronously in the effect body.
    const handle = setTimeout(
      async () => {
        if (!q) {
          if (active) {
            setResults([]);
            setOpen(false);
          }
          return;
        }
        const r = await searchAuthors(q);
        if (!active) return;
        setResults(
          r.filter(
            (a) => !selected.some((s) => s.kind === a.kind && s.id === a.id)
          )
        );
        setOpen(true);
      },
      q ? 200 : 0
    );
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, selected]);

  function add(a: AuthorSearchResult) {
    setSelected((p) => [
      ...p,
      { kind: a.kind, id: a.id, display_name: a.display_name, role: "author" },
    ]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <FormField label={t("authors")} hint={t("authorsHint")}>
      <input
        type="hidden"
        name="author_entries"
        value={JSON.stringify(
          selected.map((s) => ({
            kind: s.kind,
            id: s.id,
            role: s.role,
            name: s.display_name,
          }))
        )}
      />
      <div className="space-y-2">
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noAuthorsDefault")}</p>
        )}
        {selected.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{s.display_name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {t(`kinds.${s.kind}`)}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Select
                value={s.role}
                onChange={(e) =>
                  setSelected((p) =>
                    p.map((x) => (x.id === s.id ? { ...x, role: e.target.value } : x))
                  )
                }
                size="sm"
              >
                {AUTHOR_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected((p) => p.filter((x) => x.id !== s.id))}
                aria-label={t("role")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchAuthors")}
          />
          {open && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
              {results.map((a) => (
                <button
                  key={`${a.kind}:${a.id}`}
                  type="button"
                  onClick={() => add(a)}
                  className="block w-full px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="block truncate text-sm font-medium">
                    {a.display_name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t(`kinds.${a.kind}`)}
                    {a.detail ? ` · ${a.detail}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormField>
  );
}
