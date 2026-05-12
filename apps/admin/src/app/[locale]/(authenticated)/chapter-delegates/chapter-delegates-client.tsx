"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Button,
  Card,
  ChapterSelect,
  ConfirmDialog,
  DBC_CHAPTER_COUNTRY_CODES,
  chapterFlag,
  dbcChapterLabel,
} from "@dbc/ui";
import {
  approveChapterDelegate,
  bulkApproveChapterDelegates,
  bulkRejectChapterDelegates,
  createChapterDelegateManually,
  rejectChapterDelegate,
  revokeChapterDelegate,
  type ChapterDelegateRow,
} from "@/actions/chapter-delegates";

type Status = "active" | "pending_approval" | "rejected" | "revoked";

const STATUS_TABS: { key: Status; label: string }[] = [
  { key: "pending_approval", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "rejected", label: "Rejected" },
  { key: "revoked", label: "Revoked" },
];

// flag + chapter label both come from @dbc/ui — single source of truth.

export function ChapterDelegatesClient({
  locale,
  currentStatus,
  currentEventId,
  currentChapter,
  currentSearch,
  rows,
  events,
}: {
  locale: string;
  currentStatus: Status;
  currentEventId: string | null;
  currentChapter: string | null;
  currentSearch: string | null;
  rows: ChapterDelegateRow[];
  events: { id: string; slug: string; title: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectNote, setRejectNote] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBringsCompanion, setManualBringsCompanion] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const ticketsBase =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
  const activeEvent =
    events.find((e) => e.id === currentEventId) ?? null;
  const registrationUrl = activeEvent
    ? `${ticketsBase}/${locale}/chapter-delegate/${activeEvent.slug}/register`
    : null;

  function copyRegistrationUrl() {
    if (!registrationUrl) return;
    navigator.clipboard.writeText(registrationUrl);
    toast.success("Link copied — paste it anywhere");
  }

  function whatsappShareUrl() {
    if (!registrationUrl || !activeEvent) return "";
    const msg = `Hi! Please use this link to register as a DBC chapter delegate for ${activeEvent.title}:\n${registrationUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  function mailtoShareUrl() {
    if (!registrationUrl || !activeEvent) return "";
    const subject = `DBC chapter delegate registration — ${activeEvent.title}`;
    const body = `Please use this link to register your team for ${activeEvent.title}:\n\n${registrationUrl}\n\nLet us know if you have any questions.`;
    return `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  function handleManualSubmit(formData: FormData) {
    if (!activeEvent) return;
    setManualError(null);
    formData.set("event_id", activeEvent.id);
    formData.set("locale", locale);
    formData.set("brings_companion", manualBringsCompanion ? "true" : "false");
    startTransition(async () => {
      const res = await createChapterDelegateManually(formData);
      if (res.error) {
        setManualError(res.error);
        return;
      }
      toast.success(
        res.companionIssued
          ? "Delegate + companion added, tickets emailed"
          : "Delegate added, ticket emailed"
      );
      setManualOpen(false);
      setManualBringsCompanion(false);
      router.refresh();
    });
  }

  function setQueryParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    const all = new Set(rows.map((r) => r.involvementId));
    setSelected(all);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approveChapterDelegate(id, locale);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Delegate approved; tickets issued");
        router.refresh();
      }
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const res = await rejectChapterDelegate(id, locale, rejectNote || undefined);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Rejected");
        router.refresh();
      }
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const res = await revokeChapterDelegate(id, locale);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Revoked");
        router.refresh();
      }
    });
  }

  function handleBulkApprove() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await bulkApproveChapterDelegates(ids, locale);
      toast.success(`${res.approved} approved${res.failed ? `, ${res.failed} failed` : ""}`);
      clearSelection();
      router.refresh();
    });
  }

  function handleBulkReject() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await bulkRejectChapterDelegates(ids, locale, rejectNote || undefined);
      toast.success(`${res.rejected} rejected${res.failed ? `, ${res.failed} failed` : ""}`);
      clearSelection();
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Per-event context banner — shows when an event is filtered. Surfaces
          the public registration URL with copy + share buttons, and lets
          admin add a delegate directly without waiting for a public form. */}
      {activeEvent && registrationUrl && (
        <Card padding="md" className="rounded-lg border-primary/40 bg-accent/10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Public registration link · {activeEvent.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Share with chapter leads — anyone with the link can register
                  their team; submissions land in this approval queue.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setManualOpen((o) => !o)}
                disabled={isPending}
              >
                {manualOpen ? "Cancel" : "Add delegate manually"}
              </Button>
            </div>
            <button
              type="button"
              onClick={copyRegistrationUrl}
              className="group flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left font-mono text-xs hover:border-primary/50"
              title="Click to copy"
            >
              <span className="truncate">{registrationUrl}</span>
              <span className="rounded bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground opacity-80 group-hover:opacity-100">
                Copy
              </span>
            </button>
            <div className="flex flex-wrap gap-2">
              <a
                href={whatsappShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                Send via WhatsApp
              </a>
              <a
                href={mailtoShareUrl()}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                Email
              </a>
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                Open in new tab
              </a>
            </div>

            {manualOpen && (
              <form
                action={handleManualSubmit}
                className="mt-2 space-y-3 rounded-md border border-border bg-background p-4"
              >
                <p className="text-xs text-muted-foreground">
                  Skips the approval queue — ticket emails go out immediately.
                </p>
                {manualError && (
                  <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
                    {manualError}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      First name
                    </label>
                    <input
                      name="first_name"
                      type="text"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Last name
                    </label>
                    <input
                      name="last_name"
                      type="text"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Chapter
                    </label>
                    <ChapterSelect
                      locale={locale}
                      name="chapter_country"
                      required
                      placeholder="— Select chapter —"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">
                      Position / role
                    </label>
                    <input
                      name="position"
                      type="text"
                      required
                      placeholder="Community lead, treasurer, …"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Chapter lead name (optional)
                    </label>
                    <input
                      name="chapter_lead_name"
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Chapter lead email (optional, CC&apos;d)
                    </label>
                    <input
                      name="chapter_lead_email"
                      type="email"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manualBringsCompanion}
                    onChange={(e) =>
                      setManualBringsCompanion(e.target.checked)
                    }
                    className="accent-primary"
                  />
                  Bringing a +1 companion
                </label>
                {manualBringsCompanion && (
                  <div className="grid gap-3 sm:grid-cols-3 rounded-md border border-border bg-muted/30 p-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Companion first name
                      </label>
                      <input
                        name="companion_first_name"
                        type="text"
                        required={manualBringsCompanion}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Companion last name
                      </label>
                      <input
                        name="companion_last_name"
                        type="text"
                        required={manualBringsCompanion}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Companion email
                      </label>
                      <input
                        name="companion_email"
                        type="email"
                        required={manualBringsCompanion}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Adding…" : "Add delegate"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualOpen(false);
                      setManualBringsCompanion(false);
                    }}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </Card>
      )}

      {!activeEvent && (
        <Card padding="sm" className="rounded-lg border-dashed">
          <p className="text-xs text-muted-foreground">
            Tip: filter by event below to get the public registration link for that event and to add delegates manually.
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const active = currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setQueryParam("status", tab.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Event
          </label>
          <select
            value={currentEventId ?? ""}
            onChange={(e) => setQueryParam("event", e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Chapter
          </label>
          <ChapterSelect
            locale={locale}
            value={currentChapter ?? ""}
            onChange={(e) => setQueryParam("chapter", e.target.value || null)}
            placeholder="All chapters"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            Search name / email / position
          </label>
          <input
            type="text"
            defaultValue={currentSearch ?? ""}
            onBlur={(e) =>
              setQueryParam("q", e.target.value.trim() || null)
            }
            placeholder="search…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Bulk-action bar */}
      {selected.size > 0 && (
        <Card padding="sm" className="rounded-lg border-primary/30 bg-accent/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <strong>{selected.size}</strong> selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {currentStatus === "pending_approval" && (
                <>
                  <input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reject note (optional)"
                    className="w-60 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  />
                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        disabled={isPending}
                        className="rounded-md border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft/40 disabled:opacity-50"
                      >
                        Reject all
                      </button>
                    }
                    title="Reject selected delegates"
                    description={`Reject ${selected.size} pending registration${selected.size === 1 ? "" : "s"}. Each delegate (and lead if provided) will receive a polite rejection email.`}
                    variant="danger"
                    confirmLabel="Reject"
                    onConfirm={handleBulkReject}
                  />
                  <Button onClick={handleBulkApprove} disabled={isPending}>
                    Approve all
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <Card padding="md" className="rounded-lg">
          <p className="text-sm text-muted-foreground">
            No delegates in this view.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      e.target.checked ? selectAllVisible() : clearSelection()
                    }
                    checked={
                      rows.length > 0 && selected.size === rows.length
                    }
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium">Delegate</th>
                <th className="px-3 py-3 text-left font-medium">Chapter</th>
                <th className="px-3 py-3 text-left font-medium">Position</th>
                <th className="px-3 py-3 text-left font-medium">Companion</th>
                <th className="px-3 py-3 text-left font-medium">Event</th>
                <th className="px-3 py-3 text-left font-medium">Submitted</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.involvementId} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.involvementId)}
                      onChange={() => toggleSelect(r.involvementId)}
                      disabled={r.status !== "pending_approval"}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{r.displayName}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                    {r.chapterLeadEmail && (
                      <p className="text-[11px] text-muted-foreground">
                        Lead: {r.chapterLeadEmail}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.chapterCountry ? (
                      <>
                        <span className="mr-1" aria-hidden>
                          {chapterFlag(r.chapterCountry)}
                        </span>
                        {dbcChapterLabel(r.chapterCountry, locale)}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {r.position ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    {r.companion ? (
                      <>
                        <p>{r.companion.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.companion.email}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {r.eventTitle}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-3 text-right space-x-2">
                    {r.status === "pending_approval" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(r.involvementId)}
                          disabled={isPending}
                          className="text-xs font-medium text-primary hover:opacity-80"
                        >
                          Approve
                        </button>
                        <ConfirmDialog
                          trigger={
                            <button
                              type="button"
                              className="text-xs font-medium text-danger hover:opacity-80"
                            >
                              Reject
                            </button>
                          }
                          title="Reject delegate"
                          description={`Reject ${r.displayName}. A rejection email will be sent.`}
                          variant="danger"
                          confirmLabel="Reject"
                          onConfirm={() => handleReject(r.involvementId)}
                        />
                      </>
                    )}
                    {r.status === "active" && (
                      <ConfirmDialog
                        trigger={
                          <button
                            type="button"
                            className="text-xs font-medium text-danger hover:opacity-80"
                          >
                            Revoke
                          </button>
                        }
                        title="Revoke delegate"
                        description={`Revoke ${r.displayName}'s registration. Their ticket (and companion's, if any) will be invalidated.`}
                        variant="danger"
                        confirmLabel="Revoke"
                        onConfirm={() => handleRevoke(r.involvementId)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Recognised chapters:{" "}
        {DBC_CHAPTER_COUNTRY_CODES.map((c) => dbcChapterLabel(c, locale)).join(
          " · "
        )}
      </p>
    </div>
  );
}
