"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EVENT_ROLE_FILTER_VALUES,
  PIPELINE_STATUS_VALUES,
  CONTACT_FILTER_HIDDEN_CATEGORY_SLUGS,
  type PipelineStatus,
  type EventRoleFilterValue,
} from "@dbc/types";

interface FilterEvent {
  id: string;
  title_en: string;
}

interface FilterCategory {
  slug: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
}

/**
 * Client-side contact-list filter bar. Updates the URL on every input
 * change so the server-side `searchParams`-driven `listContacts()` call
 * re-runs. Search input is debounced; selects fire immediately. No
 * manual submit button needed.
 *
 * Disambiguated from the previous version where "Role" and "Category"
 * surfaced overlapping vocabularies. Role is now scoped to event-bound
 * actions (Speaker, Volunteer, …) — identity buckets (Sponsor, Partner,
 * Press) live exclusively under Category.
 */
export function ContactsFilterBar({
  locale,
  events,
  categories,
}: {
  locale: string;
  events: FilterEvent[];
  categories: FilterCategory[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useTranslations("admin.contacts");
  const tRole = useTranslations("admin.contacts.roles");
  const tPipeline = useTranslations("admin.contacts.pipeline");
  const tCommon = useTranslations("admin.common");

  const [search, setSearch] = useState(sp.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push a single param mutation back into the URL while preserving
  // other filter params. Passing `null` clears the param.
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if ((sp.get("q") ?? "") !== search) setParam("q", search || null);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filterInput =
    "rounded-md border border-border bg-background px-3 py-2 text-sm";

  const visibleCategories = categories.filter(
    (c) =>
      !(CONTACT_FILTER_HIDDEN_CATEGORY_SLUGS as readonly string[]).includes(
        c.slug
      )
  );

  const hasAnyFilter = Boolean(
    sp.get("q") ||
      sp.get("marketing") ||
      sp.get("event") ||
      sp.get("role") ||
      sp.get("category") ||
      sp.get("pipeline")
  );

  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className={`${filterInput} w-64`}
        />

        <select
          value={sp.get("event") ?? ""}
          onChange={(e) => setParam("event", e.target.value || null)}
          className={filterInput}
          aria-label={t("filters.eventLabel")}
        >
          <option value="">{t("allEvents")}</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title_en}
            </option>
          ))}
        </select>

        <select
          value={sp.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value || null)}
          className={filterInput}
          aria-label={t("filters.categoryLabel")}
        >
          <option value="">{t("allCategories")}</option>
          {visibleCategories.map((c) => {
            const label =
              (locale === "de" && c.name_de) ||
              (locale === "fr" && c.name_fr) ||
              c.name_en;
            return (
              <option key={c.slug} value={c.slug}>
                {label}
              </option>
            );
          })}
        </select>

        <select
          value={sp.get("role") ?? ""}
          onChange={(e) => setParam("role", e.target.value || null)}
          className={filterInput}
          aria-label={t("filters.eventRoleLabel")}
        >
          <option value="">{t("filters.eventRoleAll")}</option>
          {(EVENT_ROLE_FILTER_VALUES as readonly EventRoleFilterValue[]).map(
            (r) => (
              <option key={r} value={r}>
                {tRole(r)}
              </option>
            )
          )}
        </select>

        <select
          value={sp.get("pipeline") ?? ""}
          onChange={(e) => setParam("pipeline", e.target.value || null)}
          className={filterInput}
          aria-label={t("filters.pipelineLabel")}
        >
          <option value="">{t("filters.pipelineAll")}</option>
          {(PIPELINE_STATUS_VALUES as readonly PipelineStatus[]).map((s) => (
            <option key={s} value={s}>
              {tPipeline(`statuses.${s}`)}
            </option>
          ))}
          <option value="none">{t("filters.pipelineNone")}</option>
        </select>

        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={sp.get("marketing") === "1"}
            onChange={(e) => setParam("marketing", e.target.checked ? "1" : null)}
          />
          {t("marketingOnly")}
        </label>

        {hasAnyFilter ? (
          <button
            type="button"
            onClick={() => router.push("?", { scroll: false })}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {tCommon("cancel")}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{t("filters.categoryLabel")}:</strong>{" "}
          {t("filters.categoryHint")}
        </span>
        <span>
          <strong className="text-foreground">{t("filters.eventRoleLabel")}:</strong>{" "}
          {t("filters.eventRoleHint")}
        </span>
      </div>
    </div>
  );
}
