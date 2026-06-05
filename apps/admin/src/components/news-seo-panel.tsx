"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, FormField, Input, Textarea, Select } from "@dbc/ui";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { analyzeSeo, seoScoreBand } from "@/lib/seo-analysis";

const LOCALES = ["en", "de", "fr"] as const;
type Loc = (typeof LOCALES)[number];
const SCHEMA_TYPES = ["NewsArticle", "Article", "BlogPosting", "Opinion", "Interview"];

export type SeoDefaults = {
  focus_keyword_en?: string | null;
  focus_keyword_de?: string | null;
  focus_keyword_fr?: string | null;
  seo_title_en?: string | null;
  seo_title_de?: string | null;
  seo_title_fr?: string | null;
  seo_description_en?: string | null;
  seo_description_de?: string | null;
  seo_description_fr?: string | null;
  og_title_en?: string | null;
  og_title_de?: string | null;
  og_title_fr?: string | null;
  og_description_en?: string | null;
  og_description_de?: string | null;
  og_description_fr?: string | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
  robots_noindex?: boolean;
  robots_nofollow?: boolean;
  schema_type?: string | null;
  titles?: Record<Loc, string>;
  excerpts?: Record<Loc, string>;
};

const tokenText = { danger: "text-danger", warning: "text-warning", success: "text-success" } as const;

export function NewsSeoPanel({
  slug = "",
  defaults = {},
}: {
  slug?: string;
  defaults?: SeoDefaults;
}) {
  const t = useTranslations("admin.news.seo");
  const [active, setActive] = useState<Loc>("en");
  const g = (k: string) =>
    ((defaults as Record<string, string | null | undefined>)[k] ?? "") as string;

  const mk = (k: string): Record<Loc, string> => ({
    en: g(`${k}_en`),
    de: g(`${k}_de`),
    fr: g(`${k}_fr`),
  });
  const [kw, setKw] = useState(mk("focus_keyword"));
  const [title, setTitle] = useState(mk("seo_title"));
  const [desc, setDesc] = useState(mk("seo_description"));
  const [ogTitle, setOgTitle] = useState(mk("og_title"));
  const [ogDesc, setOgDesc] = useState(mk("og_description"));

  const effTitle = (l: Loc) => title[l] || defaults.titles?.[l] || "";
  const effDesc = (l: Loc) => desc[l] || defaults.excerpts?.[l] || "";
  const result = analyzeSeo({
    focusKeyword: kw[active],
    title: effTitle(active),
    description: effDesc(active),
    slug,
  });
  const band = seoScoreBand(result.score);
  const url = `dbc-germany.com/${active}/news/${slug || "…"}`;

  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 font-heading text-lg font-semibold">
        {t("title")}
      </summary>
      <div className="space-y-5 border-t border-border p-4">
        <p className="text-sm text-muted-foreground">{t("hint")}</p>

        {/* hidden inputs for ALL locales so every language submits */}
        {LOCALES.map((l) => (
          <span key={l}>
            <input type="hidden" name={`focus_keyword_${l}`} value={kw[l]} />
            <input type="hidden" name={`seo_title_${l}`} value={title[l]} />
            <input type="hidden" name={`seo_description_${l}`} value={desc[l]} />
            <input type="hidden" name={`og_title_${l}`} value={ogTitle[l]} />
            <input type="hidden" name={`og_description_${l}`} value={ogDesc[l]} />
          </span>
        ))}

        <div className="flex gap-1">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setActive(l)}
              className={cn(
                "rounded px-3 py-1 text-sm transition-colors",
                active === l ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Score + checklist */}
        <div className="rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("score")}</span>
            <span className={cn("font-heading text-2xl font-bold", tokenText[band])}>
              {result.score}
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {result.checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs">
                {c.pass ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>
                  {t(`checks.${c.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Google preview */}
        <div className="rounded-md border border-border p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("googlePreview")}
          </p>
          <p className="mt-1 truncate text-xs text-success">{url}</p>
          <p className="truncate text-base text-info">{effTitle(active) || "—"}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{effDesc(active)}</p>
        </div>

        {/* Per-locale editable fields (active tab) */}
        <FormField label={t("focusKeyword")}>
          <Input value={kw[active]} onChange={(e) => setKw({ ...kw, [active]: e.target.value })} />
        </FormField>
        <FormField label={`${t("metaTitle")} (${effTitle(active).length})`}>
          <Input value={title[active]} onChange={(e) => setTitle({ ...title, [active]: e.target.value })} />
        </FormField>
        <FormField label={`${t("metaDescription")} (${effDesc(active).length})`}>
          <Textarea value={desc[active]} onChange={(e) => setDesc({ ...desc, [active]: e.target.value })} rows={2} />
        </FormField>
        <FormField label={t("ogTitle")}>
          <Input value={ogTitle[active]} onChange={(e) => setOgTitle({ ...ogTitle, [active]: e.target.value })} />
        </FormField>
        <FormField label={t("ogDescription")}>
          <Textarea value={ogDesc[active]} onChange={(e) => setOgDesc({ ...ogDesc, [active]: e.target.value })} rows={2} />
        </FormField>

        {/* Shared fields */}
        <FormField label={t("ogImage")}>
          <CoverImageUpload name="og_image_url" initialUrl={defaults.og_image_url ?? null} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("schemaType")}>
            <Select name="schema_type" defaultValue={defaults.schema_type ?? "NewsArticle"}>
              {SCHEMA_TYPES.map((s) => (
                <option key={s} value={s}>
                  {t(`schemaTypes.${s}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("canonical")}>
            <Input name="canonical_url" defaultValue={defaults.canonical_url ?? ""} className="font-mono" />
          </FormField>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("robots")}</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="robots_noindex" defaultChecked={defaults.robots_noindex} className="h-4 w-4 rounded border-input" />
            {t("noindex")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="robots_nofollow" defaultChecked={defaults.robots_nofollow} className="h-4 w-4 rounded border-input" />
            {t("nofollow")}
          </label>
        </div>
      </div>
    </details>
  );
}
