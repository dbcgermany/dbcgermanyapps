"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, FormField, Input, Select } from "@dbc/ui";
import {
  getNewsCategories,
  createNewsCategory,
  deleteNewsCategory,
} from "@/actions/news-categories";
import { NEWS_CATEGORY_COLORS } from "@/lib/news-category-palette";

type PickerCategory = { id: string; name: string };

/**
 * Multi-select of news categories with a "primary" radio (drives the public
 * card badge). Emits hidden form fields: `category_ids` (multiple) +
 * `primary_category_id`. Self-fetches the category list so it drops into both
 * the new (client) and edit forms. Selections passed in for the edit case.
 * Also supports creating a category inline (reuses the createNewsCategory
 * action — same SSOT as the Manage Categories page — which revalidates the
 * live site so the new category appears there automatically).
 */
export function NewsCategoryPicker({
  locale,
  selectedIds = [],
  primaryId = null,
}: {
  locale: string;
  selectedIds?: string[];
  primaryId?: string | null;
}) {
  const t = useTranslations("admin.news.editor");
  const tCat = useTranslations("admin.news.categories");
  const tCommon = useTranslations("admin.common");
  const [cats, setCats] = useState<PickerCategory[] | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds));
  const [primary, setPrimary] = useState<string | null>(primaryId);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ en: "", de: "", fr: "", color: "" });

  const localeKey = (() => {
    const l = locale === "de" || locale === "fr" ? locale : "en";
    return `name_${l}` as "name_en" | "name_de" | "name_fr";
  })();

  function mapRows(rows: Awaited<ReturnType<typeof getNewsCategories>>): PickerCategory[] {
    return (rows ?? []).map((r) => ({
      id: r.id,
      name: (r[localeKey] as string | null) ?? r.name_en,
    }));
  }

  useEffect(() => {
    let active = true;
    getNewsCategories()
      .then((rows) => active && setCats(mapRows(rows)))
      .catch(() => active && setCats([]));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setPrimary((p) => (p === id ? null : p));
      } else {
        next.add(id);
        setPrimary((p) => p ?? id);
      }
      return next;
    });
  }

  async function deleteInline(id: string, name: string) {
    if (deletingId) return;
    if (!window.confirm(tCat("deleteConfirm", { name }))) return;
    setDeletingId(id);
    const res = await deleteNewsCategory(id);
    if (res?.error) {
      toast.error(res.error);
      setDeletingId(null);
      return;
    }
    setCats((prev) => (prev ?? []).filter((c) => c.id !== id));
    setChecked((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setPrimary((p) => (p === id ? null : p));
    setDeletingId(null);
    toast.success(tCat("deletedToast"));
  }

  async function createInline() {
    const name = draft.en.trim();
    if (!name || saving) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("name_en", name);
    if (draft.de.trim()) fd.set("name_de", draft.de.trim());
    if (draft.fr.trim()) fd.set("name_fr", draft.fr.trim());
    if (draft.color) fd.set("color", draft.color);
    const res = await createNewsCategory(fd);
    if (res?.error) {
      toast.error(res.error);
      setSaving(false);
      return;
    }
    const prevIds = new Set((cats ?? []).map((c) => c.id));
    const mapped = mapRows(await getNewsCategories());
    setCats(mapped);
    // Auto-select the freshly created category (and make it primary if none).
    const fresh = mapped.filter((c) => !prevIds.has(c.id)).map((c) => c.id);
    if (fresh.length) {
      setChecked((prev) => new Set([...prev, ...fresh]));
      setPrimary((p) => p ?? fresh[0]);
    }
    setDraft({ en: "", de: "", fr: "", color: "" });
    setAdding(false);
    setSaving(false);
    toast.success(tCat("createdToast"));
  }

  return (
    <FormField label={t("categories")} hint={t("categoriesHint")}>
      <div className="space-y-2 rounded-md border border-input bg-background p-3">
        {cats !== null && cats.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">{t("noCategories")}</p>
        )}
        {(cats ?? []).map((c) => {
          const isChecked = checked.has(c.id);
          return (
            <div key={c.id} className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="category_ids"
                  value={c.id}
                  checked={isChecked}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 rounded border-input"
                />
                {c.name}
              </label>
              <label
                className={`flex cursor-pointer items-center gap-1.5 text-xs ${
                  isChecked ? "text-foreground" : "text-muted-foreground/40"
                }`}
              >
                <input
                  type="radio"
                  name="primary_category_id"
                  value={c.id}
                  checked={primary === c.id}
                  disabled={!isChecked}
                  onChange={() => setPrimary(c.id)}
                  className="h-3.5 w-3.5 border-input"
                />
                {t("primary")}
              </label>
              <button
                type="button"
                onClick={() => deleteInline(c.id, c.name)}
                disabled={deletingId === c.id}
                title={tCommon("delete")}
                aria-label={tCommon("delete")}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {adding ? (
          <div className="space-y-2 rounded-md border border-border bg-card p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={draft.en}
                onChange={(e) => setDraft((d) => ({ ...d, en: e.target.value }))}
                placeholder={tCat("nameEn")}
                autoFocus
              />
              <Input
                value={draft.de}
                onChange={(e) => setDraft((d) => ({ ...d, de: e.target.value }))}
                placeholder={tCat("nameDe")}
              />
              <Input
                value={draft.fr}
                onChange={(e) => setDraft((d) => ({ ...d, fr: e.target.value }))}
                placeholder={tCat("nameFr")}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                size="sm"
              >
                <option value="">{tCat("color")}</option>
                {NEWS_CATEGORY_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {tCat(`colors.${c}`)}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={createInline}
                disabled={!draft.en.trim() || saving}
              >
                {saving ? tCat("creating") : tCat("create")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setDraft({ en: "", de: "", fr: "", color: "" });
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setAdding(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("newCategory")}
          </Button>
        )}
      </div>
    </FormField>
  );
}
