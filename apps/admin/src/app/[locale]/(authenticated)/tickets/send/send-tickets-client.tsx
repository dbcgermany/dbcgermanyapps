"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendSingleTicketAction,
  sendBulkTicketsAction,
  type BulkRecipient,
} from "@/actions/send-tickets";

interface Tier {
  id: string;
  name: string;
  remaining: number | null;
}

type Mode = "single" | "bulk";

interface BulkResult {
  sent: number;
  failed: number;
  errors: string[];
}

const COMMON_TITLES = [
  "",
  "Dr.",
  "Prof.",
  "Prof. Dr.",
  "Mr.",
  "Ms.",
  "Mrs.",
  "Mx.",
  "Madame",
  "Monsieur",
  "Herr",
  "Frau",
];

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else cur += ch;
    } else {
      if (ch === ",") {
        out.push(cur);
        cur = "";
      } else if (ch === '"' && cur.length === 0) inQuotes = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((p) => p.trim());
}

/**
 * Parse CSV text. Supports header row — columns (case-insensitive):
 *   title, first_name, last_name, email
 * Falls back to positional if no header present:
 *   title, first_name, last_name, email
 */
function parseCsv(text: string): BulkRecipient[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const first = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const looksLikeHeader =
    first.includes("email") ||
    first.includes("first_name") ||
    first.includes("firstname");

  let titleIdx = 0;
  let firstIdx = 1;
  let lastIdx = 2;
  let emailIdx = 3;
  let dataStart = 0;

  if (looksLikeHeader) {
    const idx = (name: string) => first.indexOf(name);
    titleIdx = idx("title");
    firstIdx = idx("first_name");
    if (firstIdx === -1) firstIdx = idx("firstname");
    lastIdx = idx("last_name");
    if (lastIdx === -1) lastIdx = idx("lastname");
    emailIdx = idx("email");
    dataStart = 1;
  }

  const out: BulkRecipient[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    const email = emailIdx >= 0 ? parts[emailIdx] : "";
    const firstName = firstIdx >= 0 ? parts[firstIdx] : "";
    if (!email || !firstName) continue;
    out.push({
      title: (titleIdx >= 0 ? parts[titleIdx] : "") ?? "",
      firstName,
      lastName: (lastIdx >= 0 ? parts[lastIdx] : "") ?? "",
      email,
    });
  }
  return out;
}

export function SendTicketsClient({
  locale,
  events,
  initialEventId,
  initialTiers,
}: {
  locale: string;
  events: { id: string; title: string }[];
  initialEventId: string;
  initialTiers: Tier[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");
  const [eventId, setEventId] = useState(initialEventId);
  const [tierId, setTierId] = useState(initialTiers[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  // Single mode state
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [acquisitionType, setAcquisitionType] = useState<
    "invited" | "assigned"
  >("invited");
  const [singleResult, setSingleResult] = useState<{
    error?: string;
    success?: boolean;
  }>({});

  // Bulk mode state
  const [csvText, setCsvText] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const parsedPreview = csvText.trim() ? parseCsv(csvText) : [];

  function handleEventChange(newEventId: string) {
    setEventId(newEventId);
    router.push(`?event=${newEventId}`);
  }

  function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSingleResult({});
    startTransition(async () => {
      const res = await sendSingleTicketAction({
        eventId,
        tierId,
        title,
        firstName,
        lastName,
        attendeeEmail,
        acquisitionType,
        locale,
      });
      setSingleResult(res);
      if (res.success) {
        setTitle("");
        setFirstName("");
        setLastName("");
        setAttendeeEmail("");
      }
    });
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBulkResult(null);
    const recipients = parseCsv(csvText);
    if (recipients.length === 0) {
      setBulkResult({ sent: 0, failed: 0, errors: ["No valid rows found"] });
      return;
    }
    startTransition(async () => {
      const res = await sendBulkTicketsAction(
        eventId,
        tierId,
        recipients,
        locale
      );
      if ("error" in res) {
        setBulkResult({ sent: 0, failed: 0, errors: [res.error!] });
      } else {
        setBulkResult(res);
      }
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? "");
    };
    reader.readAsText(file);
  }

  const t = {
    en: {
      single: "Single send",
      bulk: "Bulk send (CSV)",
      event: "Event",
      tier: "Ticket tier",
      title: "Title (optional)",
      titleHint: "Dr., Prof., Mr., Ms., Madame, …",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      acquisition: "Type",
      invited: "Invited (complimentary)",
      assigned: "Assigned (team/partner)",
      send: "Send ticket",
      sending: "Sending…",
      sent: "Ticket sent successfully.",
      csvLabel: "Paste CSV or upload file",
      csvFormat:
        "Columns: title, first_name, last_name, email (header optional; comma-separated)",
      csvExample: 'Dr.,Jay,Kalala,jay@dbc-germany.com',
      upload: "Upload CSV",
      sendBulk: "Send all",
      bulkSuccess: "{sent} sent, {failed} failed",
      preview: "Preview",
    },
    de: {
      single: "Einzelversand",
      bulk: "Stapelversand (CSV)",
      event: "Veranstaltung",
      tier: "Ticketart",
      title: "Titel (optional)",
      titleHint: "Dr., Prof., Herr, Frau, Madame, …",
      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      acquisition: "Typ",
      invited: "Eingeladen (kostenlos)",
      assigned: "Zugewiesen (Team/Partner)",
      send: "Ticket senden",
      sending: "Wird gesendet…",
      sent: "Ticket erfolgreich gesendet.",
      csvLabel: "CSV einf\u00fcgen oder Datei hochladen",
      csvFormat:
        "Spalten: title, first_name, last_name, email (Kopfzeile optional; kommagetrennt)",
      csvExample: 'Dr.,Jay,Kalala,jay@dbc-germany.com',
      upload: "CSV hochladen",
      sendBulk: "Alle senden",
      bulkSuccess: "{sent} gesendet, {failed} fehlgeschlagen",
      preview: "Vorschau",
    },
    fr: {
      single: "Envoi unique",
      bulk: "Envoi en masse (CSV)",
      event: "\u00c9v\u00e9nement",
      tier: "Type de billet",
      title: "Titre (optionnel)",
      titleHint: "Dr., Prof., M., Mme., Madame, …",
      firstName: "Pr\u00e9nom",
      lastName: "Nom",
      email: "E-mail",
      acquisition: "Type",
      invited: "Invit\u00e9 (gratuit)",
      assigned: "Attribu\u00e9 (\u00e9quipe/partenaire)",
      send: "Envoyer le billet",
      sending: "Envoi…",
      sent: "Billet envoy\u00e9 avec succ\u00e8s.",
      csvLabel: "Coller le CSV ou t\u00e9l\u00e9verser un fichier",
      csvFormat:
        "Colonnes: title, first_name, last_name, email (en-t\u00eate optionnel; s\u00e9par\u00e9 par virgule)",
      csvExample: 'Dr.,Jay,Kalala,jay@dbc-germany.com',
      upload: "T\u00e9l\u00e9verser CSV",
      sendBulk: "Tout envoyer",
      bulkSuccess: "{sent} envoy\u00e9s, {failed} \u00e9chou\u00e9s",
      preview: "Aper\u00e7u",
    },
  }[locale] ?? {
    single: "Single", bulk: "Bulk", event: "Event", tier: "Tier",
    title: "Title", titleHint: "Dr., Prof., …", firstName: "First name", lastName: "Last name", email: "Email",
    acquisition: "Type", invited: "Invited", assigned: "Assigned",
    send: "Send", sending: "…", sent: "Sent",
    csvLabel: "CSV", csvFormat: "title,first_name,last_name,email", csvExample: "",
    upload: "Upload", sendBulk: "Send", bulkSuccess: "{sent} sent, {failed} failed",
    preview: "Preview",
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mt-6">
      <div className="flex gap-2 border-b border-border">
        {(["single", "bulk"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === m
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "single" ? t.single : t.bulk}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.event}</label>
          <select
            value={eventId}
            onChange={(e) => handleEventChange(e.target.value)}
            className={inputClass}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.tier}</label>
          <select
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            className={inputClass}
          >
            {initialTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
                {tier.remaining !== null ? ` (${tier.remaining} left)` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "single" && (
        <form onSubmit={handleSingleSubmit} className="mt-6 space-y-4">
          {singleResult.error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {singleResult.error}
            </div>
          )}
          {singleResult.success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              ✓ {t.sent}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[180px_1fr_1fr]">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.title}
              </label>
              <input
                list="ticket-title-options"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titleHint}
                className={inputClass}
              />
              <datalist id="ticket-title-options">
                {COMMON_TITLES.filter(Boolean).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.firstName}
              </label>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.lastName}
              </label>
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t.email}</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={attendeeEmail}
              onChange={(e) => setAttendeeEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t.acquisition}
            </label>
            <div className="flex gap-3">
              {[
                { value: "invited", label: t.invited },
                { value: "assigned", label: t.assigned },
              ].map((at) => (
                <label
                  key={at.value}
                  className={`flex-1 flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors ${
                    acquisitionType === at.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="acquisition_type"
                    value={at.value}
                    checked={acquisitionType === at.value}
                    onChange={() =>
                      setAcquisitionType(at.value as "invited" | "assigned")
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">{at.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? t.sending : t.send}
          </button>
        </form>
      )}

      {mode === "bulk" && (
        <form onSubmit={handleBulkSubmit} className="mt-6 space-y-4">
          {bulkResult && (
            <div
              className={`rounded-md p-4 text-sm ${
                bulkResult.failed === 0
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
              }`}
            >
              {t.bulkSuccess
                .replace("{sent}", String(bulkResult.sent))
                .replace("{failed}", String(bulkResult.failed))}
              {bulkResult.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs">
                  {bulkResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t.csvLabel}
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              {t.csvFormat}
              <br />
              <span className="font-mono">{t.csvExample}</span>
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="mb-2 text-sm"
            />
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              placeholder="title,first_name,last_name,email&#10;Dr.,Jay,Kalala,jay@dbc-germany.com&#10;,Marie,Diambilay,marie@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {parsedPreview.length > 0 && (
            <div className="rounded-md border border-border">
              <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.preview} ({parsedPreview.length})
              </div>
              <ul className="max-h-48 overflow-y-auto divide-y divide-border text-sm">
                {parsedPreview.slice(0, 30).map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-1.5">
                    <span>
                      {[r.title, r.firstName, r.lastName].filter(Boolean).join(" ")}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.email}
                    </span>
                  </li>
                ))}
                {parsedPreview.length > 30 && (
                  <li className="px-3 py-1.5 text-xs text-muted-foreground">
                    … and {parsedPreview.length - 30} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !csvText.trim()}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? t.sending : t.sendBulk}
          </button>
        </form>
      )}
    </div>
  );
}
