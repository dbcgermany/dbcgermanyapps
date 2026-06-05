"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FormField } from "@dbc/ui";
import { getNewsCategories } from "@/actions/news-categories";

type PickerCategory = { id: string; name: string };

/**
 * Multi-select of news categories with a "primary" radio (drives the public
 * card badge). Emits hidden form fields: `category_ids` (multiple) +
 * `primary_category_id`. Self-fetches the category list so it drops into both
 * the new (client) and edit forms. Selections passed in for the edit case.
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
  const [cats, setCats] = useState<PickerCategory[] | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds));
  const [primary, setPrimary] = useState<string | null>(primaryId);

  useEffect(() => {
    let active = true;
    const l = locale === "de" || locale === "fr" ? locale : "en";
    const key = `name_${l}` as "name_en" | "name_de" | "name_fr";
    getNewsCategories()
      .then((rows) => {
        if (!active) return;
        setCats(
          (rows ?? []).map((r) => ({
            id: r.id,
            name: (r[key] as string | null) ?? r.name_en,
          }))
        );
      })
      .catch(() => active && setCats([]));
    return () => {
      active = false;
    };
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

  if (cats !== null && cats.length === 0) {
    return (
      <FormField label={t("categories")}>
        <p className="text-sm text-muted-foreground">{t("noCategories")}</p>
      </FormField>
    );
  }

  return (
    <FormField label={t("categories")} hint={t("categoriesHint")}>
      <div className="space-y-2 rounded-md border border-input bg-background p-3">
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
            </div>
          );
        })}
      </div>
    </FormField>
  );
}
