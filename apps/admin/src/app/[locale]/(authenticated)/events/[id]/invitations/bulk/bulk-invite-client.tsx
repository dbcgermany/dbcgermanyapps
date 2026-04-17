"use client";

import { useState, useTransition } from "react";
import {
  parseInvitationsCsv,
  bulkCreateInvitations,
  type BulkInvitationRow,
  type BulkSendResult,
} from "@/actions/invitations-bulk";

interface TierOption {
  id: string;
  name: string;
  remaining: number | null;
}

export function BulkInviteClient({
  eventId,
  locale,
  tiers,
}: {
  eventId: string;
  locale: string;
  tiers: TierOption[];
}) {
  const [defaultTierId, setDefaultTierId] = useState(tiers[0]?.id ?? "");
  const [rows, setRows] = useState<BulkInvitationRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    Array<{ line: number; message: string }>
  >([]);
  const [sendEmails, setSendEmails] = useState(true);
  const [result, setResult] = useState<BulkSendResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    const parsed = await parseInvitationsCsv(text);
    setRows(parsed.rows);
    setParseErrors(parsed.errors);
  }

  function downloadReport() {
    if (!result) return;
    const header = "email,status,error\n";
    const body = result.report
      .map(
        (r) =>
          `${r.email},${r.status},${(r.error ?? "").replace(/[\r\n,]/g, " ")}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitations-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function submit() {
    if (!defaultTierId || rows.length === 0) return;
    startTransition(async () => {
      const res = await bulkCreateInvitations({
        eventId,
        defaultTierId,
        rows,
        defaultLocale: locale,
        sendEmails,
      });
      setResult(res);
    });
  }

  const tierCapacityOk =
    tiers.find((t) => t.id === defaultTierId)?.remaining === null ||
    (tiers.find((t) => t.id === defaultTierId)?.remaining ?? 0) >= rows.length;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-lg border border-border p-4">
        <label className="block text-sm font-medium">Default tier</label>
        <p className="mt-1 text-xs text-muted-foreground">
          Used for any row without a tier_slug. Rows with a slug look up the
          matching tier on this event.
        </p>
        <select
          value={defaultTierId}
          onChange={(e) => setDefaultTierId(e.target.value)}
          className="mt-2 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.remaining !== null ? ` — ${t.remaining} left` : " — unlimited"}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-dashed border-border p-4">
        <label className="block text-sm font-medium">CSV file</label>
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-2 block text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {fileName && (
          <p className="mt-2 text-xs text-muted-foreground">
            Loaded: <code>{fileName}</code> — {rows.length} valid row
            {rows.length === 1 ? "" : "s"}
            {parseErrors.length > 0
              ? `, ${parseErrors.length} error${parseErrors.length === 1 ? "" : "s"}`
              : ""}
            .
          </p>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm dark:bg-red-900/20">
          <p className="font-medium text-red-700 dark:text-red-300">
            Parse errors
          </p>
          <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
            {parseErrors.slice(0, 20).map((err, i) => (
              <li key={i}>
                Line {err.line}: {err.message}
              </li>
            ))}
            {parseErrors.length > 20 && (
              <li>… and {parseErrors.length - 20} more</li>
            )}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-border">
          <div className="border-b border-border p-3 text-sm font-medium">
            Preview ({rows.length})
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Gender</th>
                  <th className="px-3 py-2 text-left">Country</th>
                  <th className="px-3 py-2 text-left">Tags</th>
                  <th className="px-3 py-2 text-left">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-1.5">{r.email}</td>
                    <td className="px-3 py-1.5">
                      {[r.title, r.firstName, r.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-3 py-1.5">{r.gender ?? "—"}</td>
                    <td className="px-3 py-1.5">{r.country ?? "—"}</td>
                    <td className="px-3 py-1.5">
                      {r.categoryTags.join(", ") || "—"}
                    </td>
                    <td className="px-3 py-1.5">{r.tierSlug ?? "(default)"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="p-3 text-xs text-muted-foreground">
                Showing first 50 of {rows.length}.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
          />
          Send ticket emails immediately
        </label>
        <button
          type="button"
          disabled={isPending || rows.length === 0 || !defaultTierId}
          onClick={submit}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending
            ? "Processing…"
            : `${sendEmails ? "Invite & email" : "Create without email"} ${rows.length} guest${rows.length === 1 ? "" : "s"}`}
        </button>
        {!tierCapacityOk && (
          <p className="text-xs text-destructive">
            Not enough inventory in the selected default tier.
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-lg border border-border p-4">
          <p className="font-medium">
            Done — {result.success} succeeded, {result.failed} failed.
          </p>
          <button
            type="button"
            onClick={downloadReport}
            className="mt-3 text-sm font-medium text-primary hover:opacity-80"
          >
            Download results CSV
          </button>
          <div className="mt-4 max-h-60 overflow-auto rounded border border-border text-xs">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.report.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-1.5">{r.email}</td>
                    <td className="px-3 py-1.5">
                      {r.status === "failed" ? (
                        <span className="text-red-600">failed</span>
                      ) : (
                        <span className="text-green-700">{r.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
