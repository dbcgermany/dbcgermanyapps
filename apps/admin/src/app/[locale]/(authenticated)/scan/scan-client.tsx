"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { checkInTicket, getScanStats, type ScanResult } from "@/actions/scan";
import { searchAttendees, manualCheckIn, resendTicketPdf, type AttendeeSearchResult } from "@/actions/tickets";
import { Button, Select } from "@dbc/ui";

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
  const t = useTranslations("admin.scan.client");
  const [eventId, setEventId] = useState(initialEventId);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [manualToken, setManualToken] = useState("");

  const scannerRef = useRef<unknown>(null);
  const lastScanRef = useRef<{ token: string; time: number } | null>(null);
  const containerIdRef = useRef("qr-scanner-container");

  const processToken = useCallback(
    async (token: string) => {
      // Operator gate: while a result modal is showing, refuse to accept
      // new scans. The camera keeps decoding frames in the background but
      // we drop them so the operator has time to read the result and
      // physically wave the next ticket up. Released on modal dismiss.
      // Read via ref to avoid restarting the camera on every status change.
      if (
        statusRef.current.kind === "success" ||
        statusRef.current.kind === "error"
      ) {
        return;
      }

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

      // Any exception here — network blip, expired session, RPC failure —
      // must NOT bubble to React's error boundary, or staff lose the
      // scanner mid-event. Treat unknowns as a soft "invalid" so the next
      // scan retries cleanly.
      let result: ScanResult;
      try {
        result = await checkInTicket(token, eventId);
      } catch (err) {
        console.error("[scan] check-in failed:", err);
        result = { success: false, error: "scan_failed" };
      }

      setStatus({ kind: result.success ? "success" : "error", result });

      // Stats refresh runs out-of-band: a stats failure must not affect
      // the result modal the staff just saw.
      getScanStats(eventId)
        .then(setStats)
        .catch((err) => console.error("[scan] stats refresh failed:", err));

      // Haptic feedback. Modal stays up until the operator dismisses.
      if (result.success && "vibrate" in navigator) {
        navigator.vibrate?.(150);
      } else if (!result.success && "vibrate" in navigator) {
        navigator.vibrate?.([100, 50, 100]);
      }
    },
    [eventId]
  );

  // Mirror status into a ref so processToken can read its current value
  // without re-creating the callback on every status change (which would
  // tear down + restart the camera scanner).
  const statusRef = useRef<Status>({ kind: "idle" });
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  function dismissResult() {
    setStatus({ kind: "scanning" });
    lastScanRef.current = null;
  }

  // Allow the operator to dismiss with a tap on the modal backdrop OR by
  // pressing Enter / Space. Same-screen UX as a confirmation dialog.
  useEffect(() => {
    if (status.kind !== "success" && status.kind !== "error") return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "Escape" ||
        e.key === "Spacebar"
      ) {
        e.preventDefault();
        dismissResult();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [status.kind]);

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

  const rate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Event selector */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t("selectEvent")}
        </label>
        <Select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
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
            <p className="text-sm text-muted-foreground">{t("progress")}</p>
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
          {t("startScan")}
        </Button>
      ) : (
        <div>
          <div
            id={containerIdRef.current}
            className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-black"
          />
          {status.kind === "scanning" && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t("startingCamera")}
            </p>
          )}
        </div>
      )}

      {/* Scan result modal — blocks new scans until operator dismisses.
          Tap-anywhere or Enter/Space to continue. Full-screen on mobile,
          centered card on tablet/desktop. */}
      {(status.kind === "success" || status.kind === "error") && (
        <div
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          onClick={dismissResult}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
          {status.kind === "success" ? (
            <button
              type="button"
              onClick={dismissResult}
              className="relative z-10 w-full max-w-md rounded-2xl border-4 border-success-border bg-success-soft p-8 text-left shadow-2xl transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-success-border"
              autoFocus
            >
              <p className="font-heading text-4xl font-bold text-success">
                ✓ {t("checkedIn")}
              </p>
              {status.result.tierBadgeLabel && (
                <p className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${
                      status.result.isTeam
                        ? "bg-success-strong text-white"
                        : status.result.tierPurpose === "vip"
                          ? "bg-purple-600 text-white"
                          : status.result.tierPurpose === "speaker"
                            ? "bg-orange-500 text-white"
                            : status.result.isCompanion
                              ? "bg-neutral-300 text-neutral-800"
                              : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {status.result.tierBadgeLabel}
                  </span>
                </p>
              )}
              <p className="mt-3 text-xl font-semibold text-foreground">
                {status.result.attendeeName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {status.result.tierName}
                {typeof status.result.tierPriceCents === "number" &&
                status.result.tierPriceCents > 0 ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: status.result.tierCurrency || "EUR",
                        maximumFractionDigits: 2,
                      }).format(status.result.tierPriceCents / 100)}
                    </span>
                  </>
                ) : null}
              </p>
              {status.result.referenceTier && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Access: <span className="font-semibold">{status.result.referenceTier.name}</span>
                  {" · "}
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: status.result.referenceTier.currency || "EUR",
                    maximumFractionDigits: 2,
                  }).format(status.result.referenceTier.priceCents / 100)}
                </p>
              )}
              {status.result.cateringIncluded && (
                <p className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-success-strong px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Catering
                  </span>
                </p>
              )}
              <div className="mt-6 flex items-center justify-between border-t border-success-border pt-4 text-sm">
                <span className="text-success">
                  {t("tapOrEnter")}
                </span>
                <span className="rounded-md bg-success-strong px-4 py-2 font-semibold text-white shadow">
                  {t("nextTicket")} →
                </span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={dismissResult}
              className="relative z-10 w-full max-w-md rounded-2xl border-4 border-danger-border bg-danger-soft p-8 text-left shadow-2xl transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-danger-border"
              autoFocus
            >
              <p className="font-heading text-4xl font-bold text-danger">
                ✕{" "}
                {status.result.error
                  ? t("invalid")
                  : status.result.alreadyCheckedInAt
                    ? t("alreadyScanned")
                    : t("invalid")}
              </p>
              {status.result.attendeeName && (
                <p className="mt-3 text-xl font-semibold text-foreground">
                  {status.result.attendeeName}
                </p>
              )}
              {status.result.alreadyCheckedInAt && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("at")}{" "}
                  {new Date(
                    status.result.alreadyCheckedInAt
                  ).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  {t("by")} {status.result.alreadyCheckedInBy}
                </p>
              )}
              <div className="mt-6 flex items-center justify-between border-t border-danger-border pt-4 text-sm">
                <span className="text-danger">
                  {t("tapOrEnter")}
                </span>
                <span className="rounded-md bg-danger-strong px-4 py-2 font-semibold text-white shadow">
                  {t("nextTicket")} →
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Manual entry fallback */}
      <form
        onSubmit={handleManualCheckIn}
        className="rounded-lg border border-border p-4"
      >
        <p className="text-sm font-medium mb-2">{t("manual")}</p>
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
            placeholder={t("enterToken")}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-3 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit">
            {t("submit")}
          </Button>
        </div>
      </form>

      {/* Quick-find by name (for lost-ticket visitors) */}
      <NameFindPanel eventId={eventId} locale={locale} onCheckedIn={refreshStats} />
    </div>
  );

  function refreshStats() {
    getScanStats(eventId)
      .then(setStats)
      .catch((err) => console.error("[scan] stats refresh failed:", err));
  }
}

function NameFindPanel({
  eventId,
  locale: _locale,
  onCheckedIn,
}: {
  eventId: string;
  locale: string;
  onCheckedIn: () => void;
}) {
  const ft = useTranslations("admin.scan.find");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AttendeeSearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [actionPending, startAction] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      startSearch(async () => {
        try {
          const rows = await searchAttendees({ query, eventId, limit: 20 });
          setResults(rows);
        } catch (err) {
          console.error("[scan] attendee search failed:", err);
          setResults([]);
          toast.error(ft("searchFailed"));
        }
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, eventId, ft]);

  // Derive empty state from query length rather than mutating in an effect.
  const shouldShowResults = query.trim().length >= 2;
  const visibleResults = shouldShowResults ? results : [];

  function handleCheckIn(r: AttendeeSearchResult) {
    startAction(async () => {
      // Quick-find runs during a live event — a thrown server action would
      // unmount the scanner under the route error boundary. Synthesize a
      // soft error so the staff can retry on the same screen.
      let result: Awaited<ReturnType<typeof manualCheckIn>>;
      try {
        result = await manualCheckIn(r.ticket_token, eventId);
      } catch (err) {
        console.error("[scan] manual check-in failed:", err);
        result = { error: ft("actionFailed") };
      }
      if ("error" in result) {
        toast.error(
          `${result.error}${
            result.alreadyAt
              ? ` (${new Date(result.alreadyAt).toLocaleTimeString()})`
              : ""
          }`
        );
      } else {
        toast.success(ft("checkedInToast", { name: result.attendee_name }));
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
      let result: Awaited<ReturnType<typeof resendTicketPdf>>;
      try {
        result = await resendTicketPdf(r.ticket_id);
      } catch (err) {
        console.error("[scan] resend ticket failed:", err);
        result = { error: ft("actionFailed") };
      }
      if ("error" in result) toast.error(result.error);
      else toast.success(ft("resendToast", { email: r.attendee_email }));
    });
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium mb-2">{ft("heading")}</p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={ft("placeholder")}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {searching && shouldShowResults && (
        <p className="mt-2 text-xs text-muted-foreground">{ft("searching")}</p>
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
                    ? ft("invited")
                    : r.acquisition_type === "door_sale"
                      ? ft("door")
                      : ft("paid")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.checked_in_at ? (
                  <span className="text-xs font-medium text-success">
                    {ft("checkedInTag")}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleCheckIn(r)}
                    disabled={actionPending}
                  >
                    {ft("checkIn")}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => handleResend(r)}
                  disabled={actionPending}
                >
                  {ft("resendPdf")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
