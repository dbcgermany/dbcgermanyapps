"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendSingleTicketAction,
  sendBulkTicketsAction,
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
  const [attendeeName, setAttendeeName] = useState("");
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
        attendeeName,
        attendeeEmail,
        acquisitionType,
        locale,
      });
      setSingleResult(res);
      if (res.success) {
        setAttendeeName("");
        setAttendeeEmail("");
      }
    });
  }

  function parseCsv(text: string): { name: string; email: string }[] {
    const lines = text.trim().split(/\r?\n/);
    const result: { name: string; email: string }[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      // Skip header row (detect: first column is literally "name")
      if (result.length === 0 && /^\s*name\s*,/i.test(line)) continue;

      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length >= 2 && parts[0] && parts[1]) {
        result.push({ name: parts[0], email: parts[1] });
      }
    }
    return result;
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
      name: "Attendee name",
      email: "Attendee email",
      acquisition: "Type",
      invited: "Invited (complimentary)",
      assigned: "Assigned (team/partner)",
      send: "Send ticket",
      sending: "Sending...",
      sent: "Ticket sent successfully.",
      csvLabel: "Paste CSV or upload file",
      csvFormat: "Format: name, email (one per line)",
      csvExample: "Jay Kalala, jay@dbc-germany.com",
      upload: "Upload CSV",
      sendBulk: "Send all",
      bulkSuccess: "{sent} sent, {failed} failed",
    },
    de: {
      single: "Einzelversand",
      bulk: "Stapelversand (CSV)",
      event: "Veranstaltung",
      tier: "Ticketart",
      name: "Name des Teilnehmers",
      email: "E-Mail des Teilnehmers",
      acquisition: "Typ",
      invited: "Eingeladen (kostenlos)",
      assigned: "Zugewiesen (Team/Partner)",
      send: "Ticket senden",
      sending: "Wird gesendet...",
      sent: "Ticket erfolgreich gesendet.",
      csvLabel: "CSV einf\u00FCgen oder Datei hochladen",
      csvFormat: "Format: Name, E-Mail (eine pro Zeile)",
      csvExample: "Jay Kalala, jay@dbc-germany.com",
      upload: "CSV hochladen",
      sendBulk: "Alle senden",
      bulkSuccess: "{sent} gesendet, {failed} fehlgeschlagen",
    },
    fr: {
      single: "Envoi unique",
      bulk: "Envoi en masse (CSV)",
      event: "\u00C9v\u00E9nement",
      tier: "Type de billet",
      name: "Nom du participant",
      email: "E-mail du participant",
      acquisition: "Type",
      invited: "Invit\u00E9 (gratuit)",
      assigned: "Attribu\u00E9 (\u00E9quipe/partenaire)",
      send: "Envoyer le billet",
      sending: "Envoi...",
      sent: "Billet envoy\u00E9 avec succ\u00E8s.",
      csvLabel: "Coller le CSV ou t\u00E9l\u00E9verser un fichier",
      csvFormat: "Format: nom, e-mail (un par ligne)",
      csvExample: "Jay Kalala, jay@dbc-germany.com",
      upload: "T\u00E9l\u00E9verser CSV",
      sendBulk: "Tout envoyer",
      bulkSuccess: "{sent} envoy\u00E9s, {failed} \u00E9chou\u00E9s",
    },
  }[locale] ?? {
    single: "Single", bulk: "Bulk", event: "Event", tier: "Tier", name: "Name", email: "Email", acquisition: "Type", invited: "Invited", assigned: "Assigned", send: "Send", sending: "...", sent: "Sent", csvLabel: "CSV", csvFormat: "name,email", csvExample: "", upload: "Upload", sendBulk: "Send", bulkSuccess: "{sent} sent, {failed} failed",
  };

  return (
    <div className="mt-6">
      {/* Mode tabs */}
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

      {/* Shared event + tier selectors */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.event}</label>
          <select
            value={eventId}
            onChange={(e) => handleEventChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

      {/* Single mode */}
      {mode === "single" && (
        <form onSubmit={handleSingleSubmit} className="mt-6 space-y-4">
          {singleResult.error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {singleResult.error}
            </div>
          )}
          {singleResult.success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              &#x2713; {t.sent}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.name}
              </label>
              <input
                type="text"
                required
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.email}
              </label>
              <input
                type="email"
                required
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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

      {/* Bulk mode */}
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
              {t.csvFormat} &middot; {t.csvExample}
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
              placeholder="Jay Kalala, jay@dbc-germany.com&#10;Marie Diambilay, marie@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

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
