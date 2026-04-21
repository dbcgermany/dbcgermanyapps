"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { checkInTicket, getScanStats, type ScanResult } from "@/actions/scan";
import { searchAttendees, manualCheckIn, resendTicketPdf, type AttendeeSearchResult } from "@/actions/tickets";
import { Button } from "@dbc/ui";

type Status =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "success"; result: ScanResult }
  | { kind: "error"; result: ScanResult };

const SCAN_COOLDOWN_MS = 2000;

export function ScanClient({
  locale,
  events,
  initialEventId,
  initialStats,
}: {
  locale: string;
  events: { id: string; title: string }[];
  initialEventId: string;
  initialStats: { total: number; checkedIn: number };
}) {
  const [eventId, setEventId] = useState(initialEventId);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [manualToken, setManualToken] = useState("");

  const scannerRef = useRef<unknown>(null);
  const lastScanRef = useRef<{ token: string; time: number } | null>(null);
  const containerIdRef = useRef("qr-scanner-container");

  const processToken = useCallback(
    async (token: string) => {
      // Debounce: ignore if same token scanned within cooldown
      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.token === token &&
        now - lastScanRef.current.time < SCAN_COOLDOWN_MS
      ) {
        return;
      }
      lastScanRef.current = { token, time: now };

      const result = await checkInTicket(token, eventId);

      setStatus({ kind: result.success ? "success" : "error", result });

      // Refresh stats
      const newStats = await getScanStats(eventId);
      setStats(newStats);

      // Reset status after 3 seconds
      setTimeout(() => setStatus({ kind: "scanning" }), 3000);

      // Haptic feedback on success
      if (result.success && "vibrate" in navigator) {
        navigator.vibrate?.(150);
      } else if (!result.success && "vibrate" in navigator) {
        navigator.vibrate?.([100, 50, 100]);
      }
    },
    [eventId]
  );

  // Start camera scanner
  useEffect(() => {
    if (!eventId || status.kind === "idle") return;

    type Html5QrcodeInstance = {
      start: (
        cameraConfig: { facingMode: string },
        config: { fps: number; qrbox: { width: number; height: number }; aspectRatio: number },
        onSuccess: (decodedText: string) => void,
        onError: () => void
      ) => Promise<void>;
      stop: () => Promise<void>;
      clear: () => void;
    };

    let instance: Html5QrcodeInstance | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const html5QrCode = new Html5Qrcode(
          containerIdRef.current
        ) as unknown as Html5QrcodeInstance;
        instance = html5QrCode;
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (decodedText) => processToken(decodedText),
          () => {} // Silently ignore scan errors (they fire constantly when no QR visible)
        );
      } catch (err) {
        console.error("Failed to start scanner:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (instance) {
        instance
          .stop()
          .then(() => {
            instance?.clear();
          })
          .catch(() => {});
      }
    };
  }, [eventId, status.kind, processToken]);

  async function handleManualCheckIn(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!manualToken.trim()) return;
    await processToken(manualToken.trim());
    setManualToken("");
  }

  const t = {
    en: {
      selectEvent: "Select event",
      startScan: "Start scanning",
      checkedIn: "Checked in!",
      alreadyScanned: "Already checked in",
      invalid: "Invalid ticket",
      wrongEvent: "Wrong event",
      at: "at",
      by: "by",
      manual: "Manual entry",
      enterToken: "Enter ticket code",
      submit: "Check in",
      progress: "checked in",
      startingCamera: "Starting camera...",
    },
    de: {
      selectEvent: "Veranstaltung ausw\u00E4hlen",
      startScan: "Scannen starten",
      checkedIn: "Eingecheckt!",
      alreadyScanned: "Bereits eingecheckt",
      invalid: "Ung\u00FCltiges Ticket",
      wrongEvent: "Falsche Veranstaltung",
      at: "um",
      by: "von",
      manual: "Manuelle Eingabe",
      enterToken: "Ticket-Code eingeben",
      submit: "Einchecken",
      progress: "eingecheckt",
      startingCamera: "Kamera wird gestartet...",
    },
    fr: {
      selectEvent: "S\u00E9lectionner l\u2019\u00E9v\u00E9nement",
      startScan: "Commencer le scan",
      checkedIn: "Enregistr\u00E9 !",
      alreadyScanned: "D\u00E9j\u00E0 enregistr\u00E9",
      invalid: "Billet invalide",
      wrongEvent: "Mauvais \u00E9v\u00E9nement",
      at: "\u00E0",
      by: "par",
      manual: "Saisie manuelle",
      enterToken: "Entrer le code du billet",
      submit: "Enregistrer",
      progress: "enregistr\u00E9s",
      startingCamera: "D\u00E9marrage de la cam\u00E9ra...",
    },
  }[locale] ?? {
    selectEvent: "Select event", startScan: "Start", checkedIn: "Checked in!", alreadyScanned: "Already", invalid: "Invalid", wrongEvent: "Wrong", at: "at", by: "by", manual: "Manual", enterToken: "Enter code", submit: "Check in", progress: "checked in", startingCamera: "Starting...",
  };

  const rate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Event selector */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t.selectEvent}
        </label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {/* Stats — scrolls with the page on mobile so the camera viewport
          below always has full visibility. On tablet/desktop (sm+) it's
          a normal card inside the page flow. Previously sticky on mobile,
          which caused the translucent bar to obscure the scanner corner
          markers when the scanner viewport scrolled under it. */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-heading text-3xl font-bold">
              {stats.checkedIn}
              <span className="text-lg font-normal text-muted-foreground">
                {" / "}
                {stats.total}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">{t.progress}</p>
          </div>
          <p className="font-heading text-2xl font-bold text-primary">
            {rate}%
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* Scan viewport */}
      {status.kind === "idle" ? (
        <Button
          size="lg"
          onClick={() => setStatus({ kind: "scanning" })}
          disabled={!eventId}
          className="w-full"
        >
          {t.startScan}
        </Button>
      ) : (
        <div>
          <div
            id={containerIdRef.current}
            className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-black"
          />
          {status.kind === "scanning" && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t.startingCamera}
            </p>
          )}
        </div>
      )}

      {/* Scan result banner — large so staff can read it across a loud room */}
      {status.kind === "success" && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-5 dark:bg-green-900/20">
          <p className="font-heading text-2xl font-bold text-green-700 dark:text-green-400 sm:text-xl">
            &#x2713; {t.checkedIn}
          </p>
          <p className="mt-2 text-base font-semibold sm:text-sm">
            {status.result.attendeeName}
          </p>
          <p className="text-xs text-muted-foreground">
            {status.result.tierName}
          </p>
        </div>
      )}

      {status.kind === "error" && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-5 dark:bg-red-900/20">
          <p className="font-heading text-2xl font-bold text-red-700 dark:text-red-400 sm:text-xl">
            &#x2715;{" "}
            {status.result.error
              ? t.invalid
              : status.result.alreadyCheckedInAt
                ? t.alreadyScanned
                : t.invalid}
          </p>
          {status.result.attendeeName && (
            <p className="mt-2 text-base font-semibold sm:text-sm">
              {status.result.attendeeName}
            </p>
          )}
          {status.result.alreadyCheckedInAt && (
            <p className="text-xs text-muted-foreground">
              {t.at}{" "}
              {new Date(status.result.alreadyCheckedInAt).toLocaleTimeString(
                locale,
                { hour: "2-digit", minute: "2-digit" }
              )}{" "}
              {t.by} {status.result.alreadyCheckedInBy}
            </p>
          )}
        </div>
      )}

      {/* Manual entry fallback */}
      <form
        onSubmit={handleManualCheckIn}
        className="rounded-lg border border-border p-4"
      >
        <p className="text-sm font-medium mb-2">{t.manual}</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder={t.enterToken}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-3 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit">
            {t.submit}
          </Button>
        </div>
      </form>

      {/* Quick-find by name (for lost-ticket visitors) */}
      <NameFindPanel eventId={eventId} locale={locale} onCheckedIn={() => refreshStats()} />
    </div>
  );

  async function refreshStats() {
    const s = await getScanStats(eventId);
    setStats(s);
  }
}

const FIND_T = {
  en: {
    heading: "Can’t scan? Find by name",
    placeholder: "Type a name, email, or surname…",
    searching: "Searching…",
    invited: "Invited", door: "Door", paid: "Paid",
    checkedInTag: "✓ Checked in",
    checkIn: "Check in",
    resendPdf: "Resend PDF",
    checkedInToast: "Checked in: {name}",
    resendToast: "Ticket sent to {email}.",
  },
  de: {
    heading: "Scan nicht möglich? Namen suchen",
    placeholder: "Name, E-Mail oder Nachname eingeben…",
    searching: "Wird gesucht…",
    invited: "Eingeladen", door: "Abendkasse", paid: "Bezahlt",
    checkedInTag: "✓ Eingecheckt",
    checkIn: "Einchecken",
    resendPdf: "PDF erneut senden",
    checkedInToast: "Eingecheckt: {name}",
    resendToast: "Ticket gesendet an {email}.",
  },
  fr: {
    heading: "Impossible de scanner ? Rechercher par nom",
    placeholder: "Tapez un nom, un e-mail ou un prénom…",
    searching: "Recherche…",
    invited: "Invité", door: "Entrée", paid: "Payé",
    checkedInTag: "✓ Enregistré",
    checkIn: "Enregistrer",
    resendPdf: "Renvoyer le PDF",
    checkedInToast: "Enregistré : {name}",
    resendToast: "Billet envoyé à {email}.",
  },
} as const;

function NameFindPanel({
  eventId,
  locale,
  onCheckedIn,
}: {
  eventId: string;
  locale: string;
  onCheckedIn: () => void;
}) {
  const ft = FIND_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof FIND_T];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AttendeeSearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [actionPending, startAction] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      startSearch(async () => {
        const rows = await searchAttendees({ query, eventId, limit: 20 });
        setResults(rows);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, eventId]);

  // Derive empty state from query length rather than mutating in an effect.
  const shouldShowResults = query.trim().length >= 2;
  const visibleResults = shouldShowResults ? results : [];

  function handleCheckIn(r: AttendeeSearchResult) {
    startAction(async () => {
      const result = await manualCheckIn(r.ticket_token, eventId);
      if ("error" in result) {
        toast.error(
          `${result.error}${
            result.alreadyAt
              ? ` (${new Date(result.alreadyAt).toLocaleTimeString()})`
              : ""
          }`
        );
      } else {
        toast.success(ft.checkedInToast.replace("{name}", result.attendee_name));
        onCheckedIn();
        setResults((rs) =>
          rs.map((row) =>
            row.ticket_id === r.ticket_id
              ? { ...row, checked_in_at: new Date().toISOString() }
              : row
          )
        );
      }
    });
  }

  function handleResend(r: AttendeeSearchResult) {
    startAction(async () => {
      const result = await resendTicketPdf(r.ticket_id);
      if ("error" in result) toast.error(result.error);
      else toast.success(ft.resendToast.replace("{email}", r.attendee_email));
    });
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium mb-2">{ft.heading}</p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={ft.placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {searching && shouldShowResults && (
        <p className="mt-2 text-xs text-muted-foreground">{ft.searching}</p>
      )}
      {visibleResults.length > 0 && (
        <ul className="mt-3 space-y-2">
          {visibleResults.map((r) => (
            <li
              key={r.ticket_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {[r.attendee_first_name, r.attendee_last_name]
                    .filter(Boolean)
                    .join(" ") || r.attendee_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.attendee_email} · {r.tier_name} ·{" "}
                  {r.acquisition_type === "invited" ||
                  r.acquisition_type === "assigned"
                    ? ft.invited
                    : r.acquisition_type === "door_sale"
                      ? ft.door
                      : ft.paid}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.checked_in_at ? (
                  <span className="text-xs font-medium text-green-600">
                    {ft.checkedInTag}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleCheckIn(r)}
                    disabled={actionPending}
                  >
                    {ft.checkIn}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => handleResend(r)}
                  disabled={actionPending}
                >
                  {ft.resendPdf}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
