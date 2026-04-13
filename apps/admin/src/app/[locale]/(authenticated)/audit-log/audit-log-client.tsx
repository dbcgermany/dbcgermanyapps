"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditLogEntry } from "@/actions/audit";

interface FilterState {
  action: string;
  entity: string;
  user: string;
  from: string;
  to: string;
}

export function AuditLogClient({
  locale,
  rows,
  total,
  page,
  pageSize,
  actions,
  entityTypes,
  currentActionFilter,
  currentEntityFilter,
  currentUserFilter,
  currentFromFilter,
  currentToFilter,
}: {
  locale: string;
  rows: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  actions: string[];
  entityTypes: string[];
  currentActionFilter: string;
  currentEntityFilter: string;
  currentUserFilter: string;
  currentFromFilter: string;
  currentToFilter: string;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [userInput, setUserInput] = useState(currentUserFilter);

  function pushFilters(next: Partial<FilterState> & { page?: number }) {
    const current: FilterState = {
      action: currentActionFilter,
      entity: currentEntityFilter,
      user: currentUserFilter,
      from: currentFromFilter,
      to: currentToFilter,
    };
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.action) params.set("action", merged.action);
    if (merged.entity) params.set("entity", merged.entity);
    if (merged.user) params.set("user", merged.user);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function clearFilters() {
    setUserInput("");
    router.push("?");
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  const t = {
    en: {
      filters: "Filters",
      action: "Action",
      entity: "Entity",
      user: "User email",
      userPlaceholder: "Search by email",
      from: "From",
      to: "To",
      apply: "Apply",
      clear: "Clear filters",
      allActions: "All actions",
      allEntities: "All entities",
      timestamp: "Timestamp",
      entityId: "Entity ID",
      ip: "IP",
      details: "Details",
      view: "View",
      hide: "Hide",
      noRows: "No audit log entries match your filters.",
      showing: "Showing",
      to_word: "to",
      of: "of",
      prev: "Previous",
      next: "Next",
      page: "Page",
    },
    de: {
      filters: "Filter",
      action: "Aktion",
      entity: "Entit\u00E4t",
      user: "Benutzer-E-Mail",
      userPlaceholder: "Nach E-Mail suchen",
      from: "Von",
      to: "Bis",
      apply: "Anwenden",
      clear: "Filter zur\u00FCcksetzen",
      allActions: "Alle Aktionen",
      allEntities: "Alle Entit\u00E4ten",
      timestamp: "Zeitstempel",
      entityId: "Entit\u00E4ts-ID",
      ip: "IP",
      details: "Details",
      view: "Anzeigen",
      hide: "Ausblenden",
      noRows: "Keine Eintr\u00E4ge gefunden.",
      showing: "Zeige",
      to_word: "bis",
      of: "von",
      prev: "Zur\u00FCck",
      next: "Weiter",
      page: "Seite",
    },
    fr: {
      filters: "Filtres",
      action: "Action",
      entity: "Entit\u00E9",
      user: "E-mail utilisateur",
      userPlaceholder: "Rechercher par e-mail",
      from: "Du",
      to: "Au",
      apply: "Appliquer",
      clear: "R\u00E9initialiser les filtres",
      allActions: "Toutes les actions",
      allEntities: "Toutes les entit\u00E9s",
      timestamp: "Horodatage",
      entityId: "ID entit\u00E9",
      ip: "IP",
      details: "D\u00E9tails",
      view: "Voir",
      hide: "Masquer",
      noRows: "Aucune entr\u00E9e ne correspond aux filtres.",
      showing: "Affichage",
      to_word: "\u00E0",
      of: "sur",
      prev: "Pr\u00E9c\u00E9dent",
      next: "Suivant",
      page: "Page",
    },
  }[locale] ?? {
    filters: "Filters", action: "Action", entity: "Entity", user: "User email",
    userPlaceholder: "Search by email", from: "From", to: "To", apply: "Apply",
    clear: "Clear", allActions: "All actions", allEntities: "All entities",
    timestamp: "Timestamp", entityId: "Entity ID", ip: "IP", details: "Details",
    view: "View", hide: "Hide", noRows: "No entries", showing: "Showing",
    to_word: "to", of: "of", prev: "Previous", next: "Next", page: "Page",
  };

  function formatTimestamp(iso: string) {
    return new Date(iso).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.filters}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentActionFilter}
            onChange={(e) => pushFilters({ action: e.target.value, page: 1 })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.allActions}</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={currentEntityFilter}
            onChange={(e) => pushFilters({ entity: e.target.value, page: 1 })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.allEntities}</option>
            {entityTypes.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              pushFilters({ user: userInput, page: 1 });
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t.userPlaceholder}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              {t.apply}
            </button>
          </form>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t.from}
            <input
              type="date"
              value={currentFromFilter}
              onChange={(e) =>
                pushFilters({ from: e.target.value, page: 1 })
              }
              className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t.to}
            <input
              type="date"
              value={currentToFilter}
              onChange={(e) => pushFilters({ to: e.target.value, page: 1 })}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            onClick={clearFilters}
            className="ml-auto rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t.clear}
          </button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t.noRows}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t.timestamp}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t.user}</th>
                <th className="px-4 py-3 text-left font-medium">{t.action}</th>
                <th className="px-4 py-3 text-left font-medium">{t.entity}</th>
                <th className="px-4 py-3 text-left font-medium">
                  {t.entityId}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t.ip}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.details}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isExpanded = expandedId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {r.userId ? (
                          <>
                            <p className="font-medium">
                              {r.userDisplayName ||
                                r.userEmail ||
                                "\u2014"}
                            </p>
                            {r.userEmail && (
                              <p className="text-xs text-muted-foreground">
                                {r.userEmail}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {"\u2014"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.action}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.entityType}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {r.entityId
                          ? r.entityId.slice(0, 8).toUpperCase()
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {r.ipAddress ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : r.id)
                          }
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          {isExpanded ? t.hide : t.view}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border last:border-0 bg-muted/20">
                        <td colSpan={7} className="px-4 py-3">
                          <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
                            {JSON.stringify(r.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {t.showing} {firstRow} {t.to_word} {lastRow} {t.of} {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pushFilters({ page: page - 1 })}
              disabled={page <= 1}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.prev}
            </button>
            <span>
              {t.page} {page} / {totalPages}
            </span>
            <button
              onClick={() => pushFilters({ page: page + 1 })}
              disabled={page >= totalPages}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
