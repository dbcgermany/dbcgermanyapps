"use client";

import { Input, Select } from "@dbc/ui";
import { useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * URL-synced filter row for list pages. Standardizes the layout +
 * interaction of search + select filters across /orders, /contacts,
 * /chapter-delegates, /audit-log, /reports.
 *
 * Each filter is described declaratively; changes flow through
 * router.replace so back/forward, copy/paste-able URLs, and server-side
 * filtering all work without bespoke client state. The optional
 * search input debounces inside the browser before pushing.
 *
 * Usage:
 *   <FilterBar
 *     search={{ name: "q", placeholder: t("searchPlaceholder") }}
 *     filters={[
 *       { name: "status", label: t("status"), options: [
 *         { value: "", label: t("any") },
 *         { value: "active", label: t("active") },
 *       ]},
 *     ]}
 *   />
 */
export function FilterBar({
  search,
  filters = [],
  trailing,
  className,
}: {
  search?: { name: string; placeholder?: string };
  filters?: ReadonlyArray<{
    name: string;
    label?: string;
    options: ReadonlyArray<{ value: string; label: string }>;
  }>;
  trailing?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(name: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value && value.length > 0) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  const hasAny =
    (search && (params.get(search.name) ?? "").length > 0) ||
    filters.some((f) => (params.get(f.name) ?? "").length > 0);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
      role="search"
    >
      {search && (
        <label className="relative inline-flex min-w-50 flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name={search.name}
            defaultValue={params.get(search.name) ?? ""}
            placeholder={search.placeholder}
            onChange={(e) => {
              const v = e.target.value;
              // light debounce — let typing settle before pushing URL state.
              window.clearTimeout((window as unknown as { __fb?: number }).__fb);
              (window as unknown as { __fb?: number }).__fb = window.setTimeout(
                () => setParam(search.name, v),
                250
              ) as unknown as number;
            }}
            className="pl-9"
          />
        </label>
      )}
      {filters.map((f) => (
        <label
          key={f.name}
          className="inline-flex items-center gap-2 text-sm"
        >
          {f.label && (
            <span className="text-muted-foreground">{f.label}</span>
          )}
          <Select
            value={params.get(f.name) ?? ""}
            onChange={(e) => setParam(f.name, e.target.value || null)}
            className="w-auto"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      ))}
      {hasAny && (
        <button
          type="button"
          onClick={() => {
            startTransition(() => router.replace(pathname));
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          title="Clear all filters"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Clear
        </button>
      )}
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  );
}
