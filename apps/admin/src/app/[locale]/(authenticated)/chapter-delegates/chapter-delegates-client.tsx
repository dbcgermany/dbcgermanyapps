"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Card, chapterFlag, ChapterSelect, ConfirmDialog, DBC_CHAPTER_COUNTRY_CODES, dbcChapterLabel, Input, Select, Textarea } from "@dbc/ui";
import {
  approveChapterDelegate,
  bulkApproveChapterDelegates,
  bulkRejectChapterDelegates,
  createChapterDelegateManually,
  rejectChapterDelegate,
  revokeChapterDelegate,
  sendChapterDelegateInvitesBatch,
  type ChapterDelegateRow,
} from "@/actions/chapter-delegates";

type OutreachLocale = "en" | "de" | "fr";
type OutreachAudience = "ambassador" | "team_member";

// Parses paste-friendly recipient input: one address per line, or
// `Name <email@host.tld>` style. Empty lines + obvious junk are dropped.
function parseRecipients(raw: string): { email: string; name: string }[] {
  const out: { email: string; name: string }[] = [];
  for (const line of raw.split(/\r?\n|,/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const angle = trimmed.match(/^([^<]+?)\s*<([^>]+)>\s*$/);
    if (angle) {
      out.push({ name: angle[1].trim(), email: angle[2].trim() });
    } else {
      out.push({ name: "", email: trimmed });
    }
  }
  return out;
}

type Status = "active" | "pending_approval" | "rejected" | "revoked";
const STATUS_TAB_ORDER: Status[] = [
  "pending_approval",
  "active",
  "rejected",
  "revoked",
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
  const t = useTranslations("admin.chapterDelegates");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectNote, setRejectNote] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBringsCompanion, setManualBringsCompanion] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachAudience, setOutreachAudience] =
    useState<OutreachAudience>("ambassador");
  const [outreachLocale, setOutreachLocale] = useState<OutreachLocale>(
    (locale === "de" || locale === "fr" ? locale : "en") as OutreachLocale
  );
  const [outreachRecipientsRaw, setOutreachRecipientsRaw] = useState("");
  const outreachRecipients = parseRecipients(outreachRecipientsRaw);

  function handleSendOutreach() {
    if (!activeEvent) return;
    if (outreachRecipients.length === 0) {
      toast.error(t("outreach.noValidRecipients"));
      return;
    }
    startTransition(async () => {
      const res = await sendChapterDelegateInvitesBatch({
        eventId: activeEvent.id,
        locale: outreachLocale,
        kind: outreachAudience,
        recipients: outreachRecipients,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const parts: string[] = [
        t("outreach.sentToast", { sent: res.sent ?? 0 }),
      ];
      if ((res.failed ?? 0) > 0) {
        parts.push(t("outreach.failedToast", { failed: res.failed ?? 0 }));
      }
      if ((res.skippedInvalid ?? 0) > 0) {
        parts.push(
          t("outreach.skippedToast", { skipped: res.skippedInvalid ?? 0 })
        );
      }
      toast.success(parts.join(" · "));
      setOutreachRecipientsRaw("");
      setOutreachOpen(false);
    });
  }

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
    toast.success(t("linkBanner.copied"));
  }

  function whatsappShareUrl() {
    if (!registrationUrl || !activeEvent) return "";
    return `https://wa.me/?text=${encodeURIComponent(
      t("linkBanner.whatsappBody", {
        eventTitle: activeEvent.title,
        url: registrationUrl,
      })
    )}`;
  }

  function mailtoShareUrl() {
    if (!registrationUrl || !activeEvent) return "";
    return `mailto:?subject=${encodeURIComponent(
      t("linkBanner.emailSubject", { eventTitle: activeEvent.title })
    )}&body=${encodeURIComponent(
      t("linkBanner.emailBody", {
        eventTitle: activeEvent.title,
        url: registrationUrl,
      })
    )}`;
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
          ? t("manualAdd.addedWithCompanion")
          : t("manualAdd.addedDelegate")
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
        toast.success(t("table.approvedToast"));
        router.refresh();
      }
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const res = await rejectChapterDelegate(id, locale, rejectNote || undefined);
      if (res.error) toast.error(res.error);
      else {
        toast.success(t("table.rejectedToast"));
        router.refresh();
      }
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const res = await revokeChapterDelegate(id, locale);
      if (res.error) toast.error(res.error);
      else {
        toast.success(t("table.revokedToast"));
        router.refresh();
      }
    });
  }

  function handleBulkApprove() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await bulkApproveChapterDelegates(ids, locale);
      const failTail =
        res.failed > 0 ? t("bulk.withFailures", { failed: res.failed }) : "";
      toast.success(
        t("bulk.approvedToast", { count: res.approved }) + failTail
      );
      clearSelection();
      router.refresh();
    });
  }

  function handleBulkReject() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await bulkRejectChapterDelegates(ids, locale, rejectNote || undefined);
      const failTail =
        res.failed > 0 ? t("bulk.withFailures", { failed: res.failed }) : "";
      toast.success(
        t("bulk.rejectedToast", { count: res.rejected }) + failTail
      );
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
                  {t("linkBanner.title", { eventTitle: activeEvent.title })}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("linkBanner.hint")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setOutreachOpen((o) => !o);
                    if (manualOpen) setManualOpen(false);
                  }}
                  disabled={isPending}
                >
                  {outreachOpen
                    ? t("outreach.close")
                    : t("outreach.open")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setManualOpen((o) => !o);
                    if (outreachOpen) setOutreachOpen(false);
                  }}
                  disabled={isPending}
                >
                  {manualOpen ? t("manualAdd.cancel") : t("manualAdd.open")}
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={copyRegistrationUrl}
              className="group flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left font-mono text-xs hover:border-primary/50"
              title={t("linkBanner.copyHint")}
            >
              <span className="truncate">{registrationUrl}</span>
              <span className="rounded bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground opacity-80 group-hover:opacity-100">
                {t("linkBanner.copy")}
              </span>
            </button>
            <div className="flex flex-wrap gap-2">
              <a
                href={whatsappShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                {t("linkBanner.whatsapp")}
              </a>
              <a
                href={mailtoShareUrl()}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                {t("linkBanner.email")}
              </a>
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                {t("linkBanner.openTab")}
              </a>
            </div>

            {outreachOpen && (
              <div className="space-y-3 rounded-md border border-border bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                      {t("outreach.audienceLabel")}
                    </label>
                    <div className="flex gap-1 rounded-md border border-input p-0.5 text-xs">
                      {(
                        [
                          ["ambassador", t("outreach.audienceAmbassador")],
                          ["team_member", t("outreach.audienceTeamMember")],
                        ] as const
                      ).map(([key, label]) => {
                        const active = outreachAudience === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setOutreachAudience(key)}
                            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                      {t("outreach.languageLabel")}
                    </label>
                    <div className="flex gap-1 rounded-md border border-input p-0.5 text-xs">
                      {(["de", "en", "fr"] as const).map((loc) => {
                        const active = outreachLocale === loc;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setOutreachLocale(loc)}
                            className={`flex-1 rounded px-3 py-1.5 uppercase transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {t(
                    `outreach.audienceHelp_${outreachAudience}` as
                      | "outreach.audienceHelp_ambassador"
                      | "outreach.audienceHelp_team_member"
                  )}
                </p>

                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                    {t("outreach.recipientsLabel")}
                  </label>
                  <Textarea
                    value={outreachRecipientsRaw}
                    onChange={(e) => setOutreachRecipientsRaw(e.target.value)}
                    placeholder={t("outreach.recipientsPlaceholder")}
                    rows={5}
                    className="font-mono"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("outreach.recipientsHint")}
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleSendOutreach}
                    disabled={
                      isPending || outreachRecipients.length === 0
                    }
                  >
                    {isPending
                      ? t("outreach.sending")
                      : outreachRecipients.length === 0
                        ? t("outreach.send_zero")
                        : t("outreach.send", {
                            count: outreachRecipients.length,
                          })}
                  </Button>
                </div>
              </div>
            )}

            {manualOpen && (
              <form
                action={handleManualSubmit}
                className="mt-2 space-y-3 rounded-md border border-border bg-background p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {t("manualAdd.subtitle")}
                </p>
                {manualError && (
                  <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
                    {manualError}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.firstName")}
                    </label>
                    <Input
                      name="first_name"
                      type="text"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.lastName")}
                    </label>
                    <Input
                      name="last_name"
                      type="text"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.email")}
                    </label>
                    <Input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.chapterLabel")}
                    </label>
                    <ChapterSelect
                      locale={locale}
                      name="chapter_country"
                      required
                      placeholder={t("manualAdd.pickChapter")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.position")}
                    </label>
                    <Input
                      name="position"
                      type="text"
                      required
                      placeholder={t("manualAdd.positionPh")}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.leadName")}
                    </label>
                    <Input
                      name="chapter_lead_name"
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {t("manualAdd.leadEmail")}
                    </label>
                    <Input
                      name="chapter_lead_email"
                      type="email"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Input
                    type="checkbox"
                    checked={manualBringsCompanion}
                    onChange={(e) =>
                      setManualBringsCompanion(e.target.checked)
                    }
                    className="accent-primary"
                  />
                  {t("manualAdd.bringsCompanion")}
                </label>
                {manualBringsCompanion && (
                  <div className="grid gap-3 sm:grid-cols-3 rounded-md border border-border bg-muted/30 p-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        {t("manualAdd.companionFirst")}
                      </label>
                      <Input
                        name="companion_first_name"
                        type="text"
                        required={manualBringsCompanion}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        {t("manualAdd.companionLast")}
                      </label>
                      <Input
                        name="companion_last_name"
                        type="text"
                        required={manualBringsCompanion}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        {t("manualAdd.companionEmail")}
                      </label>
                      <Input
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
                    {isPending ? t("manualAdd.submitting") : t("manualAdd.submit")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualOpen(false);
                      setManualBringsCompanion(false);
                    }}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {t("manualAdd.cancel")}
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
            {t("noEventFilter")}
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {STATUS_TAB_ORDER.map((key) => {
          const active = currentStatus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setQueryParam("status", key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`tabs.${key}`)}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t("filters.event")}
          </label>
          <Select
            value={currentEventId ?? ""}
            onChange={(e) => setQueryParam("event", e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("filters.allEvents")}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t("filters.chapter")}
          </label>
          <ChapterSelect
            locale={locale}
            value={currentChapter ?? ""}
            onChange={(e) => setQueryParam("chapter", e.target.value || null)}
            placeholder={t("filters.allChapters")}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            {t("filters.search")}
          </label>
          <Input
            type="text"
            defaultValue={currentSearch ?? ""}
            onBlur={(e) =>
              setQueryParam("q", e.target.value.trim() || null)
            }
            placeholder={t("filters.searchPlaceholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Bulk-action bar */}
      {selected.size > 0 && (
        <Card padding="sm" className="rounded-lg border-primary/30 bg-accent/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {t("bulk.selected", { count: selected.size })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {currentStatus === "pending_approval" && (
                <>
                  <Input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder={t("bulk.rejectNote")}
                    className="w-60 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  />
                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        disabled={isPending}
                        className="rounded-md border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft/40 disabled:opacity-50"
                      >
                        {t("bulk.rejectAll")}
                      </button>
                    }
                    title={t("bulk.rejectConfirmTitle")}
                    description={t("bulk.rejectConfirmDescription", {
                      count: selected.size,
                    })}
                    variant="danger"
                    confirmLabel={t("table.reject")}
                    onConfirm={handleBulkReject}
                  />
                  <Button onClick={handleBulkApprove} disabled={isPending}>
                    {t("bulk.approveAll")}
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t("bulk.clear")}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <Card padding="md" className="rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t("table.empty")}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-3 py-3 text-left">
                  <Input
                    type="checkbox"
                    onChange={(e) =>
                      e.target.checked ? selectAllVisible() : clearSelection()
                    }
                    checked={
                      rows.length > 0 && selected.size === rows.length
                    }
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium">{t("table.delegate")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("table.chapter")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("table.position")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("table.companion")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("table.event")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("table.submitted")}</th>
                <th className="px-3 py-3 text-right font-medium">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.involvementId} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <Input
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
                        {t("table.leadPrefix")}: {r.chapterLeadEmail}
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
                          {t("table.approve")}
                        </button>
                        <ConfirmDialog
                          trigger={
                            <button
                              type="button"
                              className="text-xs font-medium text-danger hover:opacity-80"
                            >
                              {t("table.reject")}
                            </button>
                          }
                          title={t("table.rejectConfirmTitle")}
                          description={t("table.rejectConfirmDescription", {
                            name: r.displayName,
                          })}
                          variant="danger"
                          confirmLabel={t("table.reject")}
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
                            {t("table.revoke")}
                          </button>
                        }
                        title={t("table.revokeConfirmTitle")}
                        description={t("table.revokeConfirmDescription", {
                          name: r.displayName,
                        })}
                        variant="danger"
                        confirmLabel={t("table.revoke")}
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
        {t("recognisedChapters", {
          list: DBC_CHAPTER_COUNTRY_CODES.map((c) =>
            dbcChapterLabel(c, locale)
          ).join(" · "),
        })}
      </p>
    </div>
  );
}
