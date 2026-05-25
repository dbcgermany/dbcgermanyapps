"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge, Select } from "@dbc/ui";
import type { CrossEventAttendee } from "@/actions/attendees";

export function AttendeesTab({
  locale,
  attendees,
  events,
  selectedEventId,
}: {
  locale: string;
  attendees: CrossEventAttendee[];
  events: Array<{ id: string; title_en: string }>;
  selectedEventId: string;
}) {
  const t = useTranslations("admin.contacts.attendeesTab");
  const tContacts = useTranslations("admin.contacts");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "checked_in" | "not_checked_in">(
    "all"
  );
  const [marketingOnly, setMarketingOnly] = useState(false);

  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      if (filter === "checked_in" && !a.checked_in_at) return false;
      if (filter === "not_checked_in" && a.checked_in_at) return false;
      if (marketingOnly && (!a.marketing_consent || a.unsubscribed_at))
        return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          a.attendee_name.toLowerCase().includes(q) ||
          a.attendee_email.toLowerCase().includes(q) ||
          a.ticket_token.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendees, query, filter, marketingOnly]);

  const acqLabels: Record<string, string> = {
    purchased: t("purchased"),
    invited: t("invited"),
    assigned: t("assigned"),
    door_sale: t("doorSale"),
  };

  function exportCsv() {
    const headers = [
      "name",
      "email",
      "country",
      "categories",
      "event",
      "tier",
      "acquisition",
      "marketing",
      "checked_in_at",
      "ticket_id",
    ];
    const rows = filtered.map((a) => [
      a.attendee_name,
      a.attendee_email,
      a.country ?? "",
      a.categories.map((c) => c.slug).join("|"),
      a.event_title,
      a.tier_name,
      a.acquisition_type,
      a.marketing_consent && !a.unsubscribed_at ? "yes" : "no",
      a.checked_in_at ?? "",
      a.ticket_token,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const scope = selectedEventId
      ? `event-${selectedEventId.slice(0, 8)}`
      : "all-events";
    link.download = `attendees-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function onEventChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "attendees");
    if (e.target.value) params.set("event", e.target.value);
    else params.delete("event");
    window.location.search = params.toString();
  }

  const filterInput =
    "rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className={`${filterInput} w-full flex-1 sm:min-w-60`}
        />
        <Select
          value={selectedEventId}
          onChange={onEventChange}
          className={filterInput}
        >
          <option value="">{t("allEvents")}</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title_en}
            </option>
          ))}
        </Select>
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(
            [
              { value: "all", label: t("all") },
              { value: "checked_in", label: t("checkedIn") },
              { value: "not_checked_in", label: t("notCheckedIn") },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Newsletter-only filter — parity with the Contacts tab. The same
            `marketing_consent` + `unsubscribed_at` columns drive both. */}
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={marketingOnly}
            onChange={(e) => setMarketingOnly(e.target.checked)}
          />
          {tContacts("marketingOnly")}
        </label>
        <button
          onClick={exportCsv}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("export")}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("noResults")}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t("name")}</th>
                <th className="px-4 py-3 text-left font-medium">
                  {tContacts("country")}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t("event")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("tier")}</th>
                <th className="px-4 py-3 text-left font-medium">
                  {tContacts("categories")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tContacts("marketing")}
                </th>
                <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                // Every cell renders a Link to the contact profile when a
                // contact_id is present (post-2026 tickets always carry one).
                // Pre-fix rows with NULL contact_id fall back to a plain
                // span so the row at least still displays.
                const href = a.contact_id
                  ? `/${locale}/contacts/${a.contact_id}`
                  : null;
                const cellClass =
                  "block px-4 py-3 hover:bg-muted/30 focus:bg-muted/40 focus:outline-none";
                const Cell = ({
                  children,
                }: {
                  children: React.ReactNode;
                }) =>
                  href ? (
                    <Link href={href} className={cellClass} tabIndex={-1}>
                      {children}
                    </Link>
                  ) : (
                    <span className={`block px-4 py-3 ${a.contact_id ? "" : "cursor-default"}`}>
                      {children}
                    </span>
                  );

                return (
                  <tr
                    key={a.id}
                    className="border-b border-border align-top last:border-0"
                  >
                    <td className="p-0">
                      <Cell>
                        <p className="font-medium">{a.attendee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.attendee_email}
                        </p>
                      </Cell>
                    </td>
                    <td className="p-0">
                      <Cell>{a.country ?? "—"}</Cell>
                    </td>
                    <td className="p-0">
                      <Cell>
                        <p className="truncate">{a.event_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.event_starts_at).toLocaleDateString(
                            locale,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </Cell>
                    </td>
                    <td className="p-0">
                      <Cell>
                        <p>{a.tier_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {acqLabels[a.acquisition_type] ?? a.acquisition_type}
                        </p>
                      </Cell>
                    </td>
                    <td className="p-0">
                      <Cell>
                        {a.categories.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {a.categories.map((c) => (
                              <Badge key={c.slug} variant="default">
                                {c.name_en}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Cell>
                    </td>
                    <td className="p-0">
                      <Cell>
                        {a.marketing_consent && !a.unsubscribed_at ? (
                          <Badge variant="success">✓</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </Cell>
                    </td>
                    <td className="p-0">
                      <Cell>
                        {a.checked_in_at ? (
                          <Badge variant="success">
                            ✓{" "}
                            {new Date(a.checked_in_at).toLocaleTimeString(
                              locale,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="default">{t("notScanned")}</Badge>
                        )}
                      </Cell>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
