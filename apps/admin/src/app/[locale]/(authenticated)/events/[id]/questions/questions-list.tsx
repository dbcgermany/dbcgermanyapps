"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@dbc/ui";
import {
  updateSpeakerQuestionStatus,
  updateSpeakerQuestionNotes,
  type AdminSpeakerQuestion,
  type SpeakerQuestionStatus,
} from "@/actions/speaker-questions";

const STATUS_FILTERS: Array<{
  value: "all" | SpeakerQuestionStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "answered", label: "Answered" },
  { value: "declined", label: "Declined" },
];

const STATUS_OPTIONS: Array<{ value: SpeakerQuestionStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "answered", label: "Answered" },
  { value: "declined", label: "Declined" },
];

function statusBadge(status: SpeakerQuestionStatus) {
  if (status === "new") return <Badge variant="warning">New</Badge>;
  if (status === "shortlisted") return <Badge variant="default">Shortlisted</Badge>;
  if (status === "answered") return <Badge variant="success">Answered</Badge>;
  return <Badge variant="default">Declined</Badge>;
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const rest = email.slice(at + 1);
  const dot = rest.lastIndexOf(".");
  const domain = dot > 0 ? rest.slice(0, dot) : rest;
  const tld = dot > 0 ? rest.slice(dot) : "";
  const maskLocal = local[0] + "*".repeat(Math.max(2, local.length - 1));
  const maskDomain =
    domain.length <= 1
      ? domain
      : domain[0] + "*".repeat(Math.max(2, domain.length - 1));
  return `${maskLocal}@${maskDomain}${tld}`;
}

function formatRelative(iso: string, locale: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.round(ms / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function QuestionsList({
  locale,
  eventId,
  questions,
}: {
  locale: string;
  eventId: string;
  questions: AdminSpeakerQuestion[];
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | SpeakerQuestionStatus
  >("all");
  const [speakerFilter, setSpeakerFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const speakerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      const name = `${q.speaker_first_name} ${q.speaker_last_name}`.trim();
      if (!map.has(q.speaker_id) && name) map.set(q.speaker_id, name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (speakerFilter !== "all" && q.speaker_id !== speakerFilter) return false;
      if (query.trim()) {
        const needle = query.toLowerCase();
        return (
          q.attendee_name.toLowerCase().includes(needle) ||
          q.attendee_email.toLowerCase().includes(needle) ||
          q.question.toLowerCase().includes(needle) ||
          `${q.speaker_first_name} ${q.speaker_last_name}`
            .toLowerCase()
            .includes(needle)
        );
      }
      return true;
    });
  }, [questions, statusFilter, speakerFilter, query]);

  function setStatus(id: string, next: SpeakerQuestionStatus) {
    startTransition(async () => {
      await updateSpeakerQuestionStatus(id, next, eventId, locale);
    });
  }

  function startEditingNotes(q: AdminSpeakerQuestion) {
    setEditingNotes(q.id);
    setNotesDraft(q.admin_notes ?? "");
  }
  function saveNotes(id: string) {
    startTransition(async () => {
      await updateSpeakerQuestionNotes(id, notesDraft, eventId, locale);
      setEditingNotes(null);
    });
  }

  function exportCsv() {
    const headers = [
      "speaker",
      "question",
      "from_name",
      "from_email",
      "status",
      "submitted_at",
      "admin_notes",
    ];
    const rows = filtered.map((q) => [
      `${q.speaker_first_name} ${q.speaker_last_name}`.trim(),
      q.question.replace(/\n/g, " "),
      q.attendee_name,
      q.attendee_email,
      q.status,
      q.created_at,
      (q.admin_notes ?? "").replace(/\n/g, " "),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `speaker-questions-${eventId.slice(0, 8)}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, speaker or question text"
          className="w-full flex-1 sm:min-w-60 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-1 rounded-md border border-border p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={speakerFilter}
          onChange={(e) => setSpeakerFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All speakers</option>
          {speakerOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={exportCsv}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No questions match this filter.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Speaker</th>
                <th className="px-4 py-3 text-left font-medium">Question</th>
                <th className="px-4 py-3 text-left font-medium">From</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const speakerName = `${q.speaker_first_name} ${q.speaker_last_name}`.trim();
                const isExpanded = !!expanded[q.id];
                const truncated =
                  q.question.length > 140
                    ? `${q.question.slice(0, 137)}…`
                    : q.question;
                return (
                  <tr
                    key={q.id}
                    className="border-b border-border last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{speakerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((s) => ({ ...s, [q.id]: !isExpanded }))
                        }
                        className="text-left text-sm leading-6"
                      >
                        {isExpanded ? q.question : truncated}
                      </button>
                      <div className="mt-2">
                        {editingNotes === q.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              rows={2}
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Internal notes (only admins see this)"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveNotes(q.id)}
                                disabled={isPending}
                                className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingNotes(null)}
                                className="text-xs text-muted-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingNotes(q)}
                            className="text-left text-xs text-muted-foreground hover:text-foreground"
                          >
                            {q.admin_notes || (
                              <span className="italic">Add a note</span>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{q.attendee_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {maskEmail(q.attendee_email)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatRelative(q.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {statusBadge(q.status)}
                        <select
                          value={q.status}
                          onChange={(e) =>
                            setStatus(
                              q.id,
                              e.target.value as SpeakerQuestionStatus
                            )
                          }
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                          disabled={isPending}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
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
