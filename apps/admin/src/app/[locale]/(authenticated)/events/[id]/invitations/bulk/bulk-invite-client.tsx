"use client";

import { useState, useTransition } from "react";
import { Button } from "@dbc/ui";
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

const T = {
  en: {
    defaultTier: "Default tier",
    defaultTierHelp:
      "Used for any row without a tier_slug. Rows with a slug look up the matching tier on this event.",
    left: "left", unlimited: "unlimited",
    csvFile: "CSV file",
    loaded: "Loaded",
    validRow: "valid row", validRows: "valid rows",
    errors: "errors", error: "error",
    parseErrors: "Parse errors",
    line: "Line", andMore: "… and {n} more",
    preview: "Preview", email: "Email", name: "Name", gender: "Gender",
    country: "Country", tags: "Tags", tier: "Tier",
    showingFirst: "Showing first 50 of {n}.",
    delivery: "Delivery",
    justTicket: "Just the ticket",
    ticketWithLetter: "Ticket + formal invitation letter",
    invitedGuests: "Invited guests",
    preAssigned: "Pre-assigned tickets",
    sendNow: "Send ticket emails immediately",
    processing: "Processing…",
    inviteAndEmail: "Invite & email",
    createWithoutEmail: "Create without email",
    guest: "guest", guests: "guests",
    notEnough: "Not enough inventory in the selected default tier.",
    done: "Done — {s} succeeded, {f} failed.",
    downloadResults: "Download results CSV",
    status: "Status", errorCol: "Error",
    defaultTierTag: "(default)",
  },
  de: {
    defaultTier: "Standardkategorie",
    defaultTierHelp:
      "Wird für alle Zeilen ohne tier_slug verwendet. Zeilen mit slug suchen die passende Kategorie.",
    left: "übrig", unlimited: "unbegrenzt",
    csvFile: "CSV-Datei",
    loaded: "Geladen",
    validRow: "gültige Zeile", validRows: "gültige Zeilen",
    errors: "Fehler", error: "Fehler",
    parseErrors: "Parse-Fehler",
    line: "Zeile", andMore: "… und {n} weitere",
    preview: "Vorschau", email: "E-Mail", name: "Name", gender: "Geschlecht",
    country: "Land", tags: "Tags", tier: "Kategorie",
    showingFirst: "Zeige die ersten 50 von {n}.",
    delivery: "Versand",
    justTicket: "Nur das Ticket",
    ticketWithLetter: "Ticket + formeller Einladungsbrief",
    invitedGuests: "Eingeladene Gäste",
    preAssigned: "Vorab zugewiesene Tickets",
    sendNow: "Ticket-E-Mails sofort senden",
    processing: "Wird verarbeitet…",
    inviteAndEmail: "Einladen & senden",
    createWithoutEmail: "Erstellen ohne E-Mail",
    guest: "Gast", guests: "Gäste",
    notEnough: "Nicht genug Bestand in der gewählten Standardkategorie.",
    done: "Fertig — {s} erfolgreich, {f} fehlgeschlagen.",
    downloadResults: "Ergebnisse als CSV herunterladen",
    status: "Status", errorCol: "Fehler",
    defaultTierTag: "(Standard)",
  },
  fr: {
    defaultTier: "Catégorie par défaut",
    defaultTierHelp:
      "Utilisée pour toute ligne sans tier_slug. Les lignes avec slug recherchent la catégorie correspondante.",
    left: "restants", unlimited: "illimité",
    csvFile: "Fichier CSV",
    loaded: "Chargé",
    validRow: "ligne valide", validRows: "lignes valides",
    errors: "erreurs", error: "erreur",
    parseErrors: "Erreurs d’analyse",
    line: "Ligne", andMore: "… et {n} de plus",
    preview: "Aperçu", email: "E-mail", name: "Nom", gender: "Genre",
    country: "Pays", tags: "Tags", tier: "Catégorie",
    showingFirst: "Affichage des 50 premières sur {n}.",
    delivery: "Envoi",
    justTicket: "Uniquement le billet",
    ticketWithLetter: "Billet + lettre d’invitation formelle",
    invitedGuests: "Invités",
    preAssigned: "Billets pré-attribués",
    sendNow: "Envoyer les e-mails immédiatement",
    processing: "Traitement…",
    inviteAndEmail: "Inviter & envoyer",
    createWithoutEmail: "Créer sans e-mail",
    guest: "invité", guests: "invités",
    notEnough: "Stock insuffisant dans la catégorie par défaut sélectionnée.",
    done: "Terminé — {s} réussies, {f} échouées.",
    downloadResults: "Télécharger les résultats en CSV",
    status: "Statut", errorCol: "Erreur",
    defaultTierTag: "(par défaut)",
  },
} as const;

export function BulkInviteClient({
  eventId,
  locale,
  tiers,
}: {
  eventId: string;
  locale: string;
  tiers: TierOption[];
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [defaultTierId, setDefaultTierId] = useState(tiers[0]?.id ?? "");
  const [rows, setRows] = useState<BulkInvitationRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    Array<{ line: number; message: string }>
  >([]);
  const [sendEmails, setSendEmails] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<
    "ticket_only" | "ticket_with_letter"
  >("ticket_with_letter");
  const [acquisitionType, setAcquisitionType] = useState<"invited" | "assigned">(
    "invited"
  );
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
        deliveryMode,
        acquisitionType,
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
        <label className="block text-sm font-medium">{t.defaultTier}</label>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.defaultTierHelp}
        </p>
        <select
          value={defaultTierId}
          onChange={(e) => setDefaultTierId(e.target.value)}
          className="mt-2 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name}
              {tier.remaining !== null ? ` — ${tier.remaining} ${t.left}` : ` — ${t.unlimited}`}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-dashed border-border p-4">
        <label className="block text-sm font-medium">{t.csvFile}</label>
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
            {t.loaded}: <code>{fileName}</code> — {rows.length} {rows.length === 1 ? t.validRow : t.validRows}
            {parseErrors.length > 0
              ? `, ${parseErrors.length} ${parseErrors.length === 1 ? t.error : t.errors}`
              : ""}
            .
          </p>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm dark:bg-red-900/20">
          <p className="font-medium text-red-700 dark:text-red-300">
            {t.parseErrors}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
            {parseErrors.slice(0, 20).map((err, i) => (
              <li key={i}>
                {t.line} {err.line}: {err.message}
              </li>
            ))}
            {parseErrors.length > 20 && (
              <li>{t.andMore.replace("{n}", String(parseErrors.length - 20))}</li>
            )}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-border">
          <div className="border-b border-border p-3 text-sm font-medium">
            {t.preview} ({rows.length})
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">{t.email}</th>
                  <th className="px-3 py-2 text-left">{t.name}</th>
                  <th className="px-3 py-2 text-left">{t.gender}</th>
                  <th className="px-3 py-2 text-left">{t.country}</th>
                  <th className="px-3 py-2 text-left">{t.tags}</th>
                  <th className="px-3 py-2 text-left">{t.tier}</th>
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
                    <td className="px-3 py-1.5">{r.tierSlug ?? t.defaultTierTag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="p-3 text-xs text-muted-foreground">
                {t.showingFirst.replace("{n}", String(rows.length))}
              </p>
            )}
          </div>
        </div>
      )}

      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.delivery}
        </legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="bulk_delivery_mode"
              checked={deliveryMode === "ticket_only"}
              onChange={() => setDeliveryMode("ticket_only")}
              className="accent-primary"
            />
            {t.justTicket}
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="bulk_delivery_mode"
              checked={deliveryMode === "ticket_with_letter"}
              onChange={() => setDeliveryMode("ticket_with_letter")}
              className="accent-primary"
            />
            {t.ticketWithLetter}
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="bulk_acquisition_type"
              checked={acquisitionType === "invited"}
              onChange={() => setAcquisitionType("invited")}
              className="accent-primary"
            />
            {t.invitedGuests}
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="bulk_acquisition_type"
              checked={acquisitionType === "assigned"}
              onChange={() => setAcquisitionType("assigned")}
              className="accent-primary"
            />
            {t.preAssigned}
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
          />
          {t.sendNow}
        </label>
        <Button type="button"
          disabled={isPending || rows.length === 0 || !defaultTierId}
          onClick={submit}>
          {isPending
            ? t.processing
            : `${sendEmails ? t.inviteAndEmail : t.createWithoutEmail} ${rows.length} ${rows.length === 1 ? t.guest : t.guests}`}
        </Button>
        {!tierCapacityOk && (
          <p className="text-xs text-destructive">
            {t.notEnough}
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-lg border border-border p-4">
          <p className="font-medium">
            {t.done.replace("{s}", String(result.success)).replace("{f}", String(result.failed))}
          </p>
          <button
            type="button"
            onClick={downloadReport}
            className="mt-3 text-sm font-medium text-primary hover:opacity-80"
          >
            {t.downloadResults}
          </button>
          <div className="mt-4 max-h-60 overflow-auto rounded border border-border text-xs">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">{t.email}</th>
                  <th className="px-3 py-2 text-left">{t.status}</th>
                  <th className="px-3 py-2 text-left">{t.errorCol}</th>
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
