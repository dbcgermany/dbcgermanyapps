"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, PhoneInput } from "@dbc/ui";
import {
  createDoorSale,
  downloadDoorSaleTicketPdf,
  updateAttendeeEmailAndResend,
  voidDoorSale,
  type PlaceholderOrderRow,
} from "@/actions/door-sale";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
  remaining: number | null;
}

export function DoorSaleClient({
  locale,
  mode,
  events,
  initialEventId,
  initialTiers,
  placeholderRows,
}: {
  locale: string;
  mode: "door" | "advance";
  events: { id: string; title: string }[];
  initialEventId: string;
  initialTiers: Tier[];
  placeholderRows: PlaceholderOrderRow[];
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState(initialEventId);
  const [tierId, setTierId] = useState(initialTiers[0]?.id ?? "");
  // Persist form across the router.push() that fires when the operator
  // switches event (it reloads the page so React state would otherwise
  // reset). sessionStorage survives same-tab navigation; pulled out into
  // a small helper so we don't crash during SSR (window undefined).
  const STORAGE_KEY = "doorSaleDraft";
  const draft =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "{}") as {
              attendeeName?: string;
              attendeeEmail?: string;
              phone?: string;
              paymentMethod?: "cash" | "sepa" | "comp";
            };
          } catch {
            return {};
          }
        })()
      : {};
  const [attendeeName, setAttendeeName] = useState(draft.attendeeName ?? "");
  const [attendeeEmail, setAttendeeEmail] = useState(draft.attendeeEmail ?? "");
  const [phone, setPhone] = useState(draft.phone ?? "");
  // "cash" + "sepa" are DB payment_method enum values. "comp" is a UX-only
  // pseudo-value the action translates to a NULL payment_method (for comped
  // tickets). Prior bug: this state used "bank_transfer", which isn't in
  // the DB enum — any submission with that value failed the insert.
  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "sepa" | "comp">(draft.paymentMethod ?? "cash");
  const [result, setResult] = useState<{
    error?: string;
    success?: boolean;
    orderId?: string;
  }>({});
  const [lastSale, setLastSale] = useState<{
    orderId: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPdf(orderId: string) {
    setDownloading(true);
    try {
      const res = await downloadDoorSaleTicketPdf(orderId, locale);
      if ("error" in res) {
        setResult({ error: res.error });
        return;
      }
      // Build a Blob from the base64 PDF and trigger a download. Standard
      // browser pattern — no extra deps. Object URL is revoked after click
      // so we don't leak memory.
      const bytes = Uint8Array.from(atob(res.pdfBase64), (c) =>
        c.charCodeAt(0)
      );
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  // Persist draft on every change so the next route.push restore picks it up.
  // Cheap (~few writes per keystroke); no debounce needed at this volume.
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ attendeeName, attendeeEmail, phone, paymentMethod })
      );
    } catch {
      // sessionStorage may be disabled (private mode) — silently skip.
    }
  }

  function clearDraft() {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }

  function handleEventChange(newEventId: string) {
    setEventId(newEventId);
    // Navigate to reload tiers for the new event, preserve mode. The
    // sessionStorage block above already saved the draft, so the form
    // values come back when this page re-renders.
    router.push(`?mode=${mode}&event=${newEventId}`);
  }

  function handleSubmit(formData: FormData) {
    const name = (formData.get("attendee_name") as string) || "";
    startTransition(async () => {
      const res = await createDoorSale(formData);
      setResult(res);
      if (res.success && res.orderId) {
        setLastSale({ orderId: res.orderId, name });
        setAttendeeName("");
        setAttendeeEmail("");
        setPhone("");
        clearDraft();
        // Refresh to update tier remaining counts
        router.refresh();
      }
    });
  }

  function handleVoid() {
    if (!lastSale) return;
    startTransition(async () => {
      const res = await voidDoorSale(lastSale.orderId, locale);
      if (res.success) {
        setLastSale(null);
        setResult({});
        router.refresh();
      } else {
        setResult({ error: res.error });
      }
    });
  }

  const t = {
    en: {
      selectEvent: "Event",
      selectTier: "Ticket tier",
      name: "Attendee name",
      email: "Attendee email",
      emailHint:
        "Required \u2014 the ticket PDF + QR code are emailed here right after the sale.",
      phoneLbl: "Phone (optional)",
      payment: "Payment method",
      cash: "Cash",
      bankTransfer: "Bank transfer",
      comp: "Complimentary",
      create: "Create ticket",
      success: "Ticket created and emailed.",
      creating: "Creating...",
      soldOut: "Sold out",
      remaining: "{n} remaining",
      cashOnlyNote: "Card buyers should scan the online-purchase poster.",
      downloadPdf: "Download PDF",
      downloading: "\u2026",
      placeholderBanner:
        "{n} historic door-sale ticket(s) still have no real email \u2014 fix below to deliver",
      placeholderColAttendee: "Attendee",
      placeholderColEvent: "Event",
      placeholderColEmail: "New email",
      placeholderResend: "Send",
      placeholderSent: "\u2713 Sent",
      placeholderResendErr: "Failed",
    },
    de: {
      selectEvent: "Veranstaltung",
      selectTier: "Ticketart",
      name: "Name des Teilnehmers",
      email: "E-Mail des Teilnehmers",
      emailHint:
        "Pflicht \u2014 Ticket-PDF + QR-Code gehen direkt nach dem Verkauf an diese Adresse.",
      phoneLbl: "Telefon (optional)",
      payment: "Zahlungsmethode",
      cash: "Bar",
      bankTransfer: "\u00DCberweisung",
      comp: "Kostenlos",
      create: "Ticket erstellen",
      success: "Ticket erstellt und per E-Mail gesendet.",
      creating: "Wird erstellt...",
      soldOut: "Ausverkauft",
      remaining: "Noch {n}",
      cashOnlyNote: "Kartenzahler sollten den Online-Kaufposter scannen.",
      downloadPdf: "PDF herunterladen",
      downloading: "\u2026",
      placeholderBanner:
        "{n} historische T\u00FCrticket(s) ohne echte E-Mail \u2014 hier eintragen und neu versenden",
      placeholderColAttendee: "Teilnehmer",
      placeholderColEvent: "Veranstaltung",
      placeholderColEmail: "Neue E-Mail",
      placeholderResend: "Senden",
      placeholderSent: "\u2713 Gesendet",
      placeholderResendErr: "Fehler",
    },
    fr: {
      selectEvent: "\u00C9v\u00E9nement",
      selectTier: "Type de billet",
      name: "Nom du participant",
      email: "E-mail du participant",
      emailHint:
        "Obligatoire \u2014 le billet PDF + QR sont envoy\u00E9s \u00E0 cette adresse imm\u00E9diatement.",
      phoneLbl: "T\u00E9l\u00E9phone (optionnel)",
      payment: "Mode de paiement",
      cash: "Esp\u00E8ces",
      bankTransfer: "Virement",
      comp: "Gratuit",
      create: "Cr\u00E9er le billet",
      success: "Billet cr\u00E9\u00E9 et envoy\u00E9 par e-mail.",
      creating: "Cr\u00E9ation...",
      soldOut: "\u00C9puis\u00E9",
      remaining: "{n} restants",
      cashOnlyNote:
        "Les acheteurs par carte doivent scanner l\u2019affiche d\u2019achat en ligne.",
      downloadPdf: "T\u00E9l\u00E9charger le PDF",
      downloading: "\u2026",
      placeholderBanner:
        "{n} billet(s) historique(s) sans vraie e-mail \u2014 saisissez ci-dessous pour renvoyer",
      placeholderColAttendee: "Participant",
      placeholderColEvent: "\u00C9v\u00E9nement",
      placeholderColEmail: "Nouvelle e-mail",
      placeholderResend: "Envoyer",
      placeholderSent: "\u2713 Envoy\u00E9",
      placeholderResendErr: "\u00C9chec",
    },
  }[locale] ?? {
    selectEvent: "Event", selectTier: "Tier", name: "Name", email: "Email",
    emailHint: "Required.",
    phoneLbl: "Phone",
    payment: "Payment", cash: "Cash", bankTransfer: "Transfer", comp: "Comp",
    create: "Create", success: "Done", creating: "...", soldOut: "Sold out",
    remaining: "{n} left", cashOnlyNote: "Card buyers scan the poster.",
    downloadPdf: "Download PDF", downloading: "\u2026",
    placeholderBanner: "{n} historic tickets need a real email",
    placeholderColAttendee: "Attendee",
    placeholderColEvent: "Event",
    placeholderColEmail: "New email",
    placeholderResend: "Send",
    placeholderSent: "\u2713 Sent",
    placeholderResendErr: "Failed",
  };

  return (
    <form action={handleSubmit} className="mt-6 space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="event_id" value={eventId} />

      {result.error && (
        <div className="rounded-md bg-danger-soft p-4 text-sm text-danger">
          {result.error}
        </div>
      )}
      {result.success && lastSale && (
        <div className="rounded-md bg-success-soft p-4 text-sm text-success">
          <div className="flex items-center justify-between gap-4">
            <span>
              &#x2713; {t.success} &mdash; {lastSale.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(lastSale.orderId)}
                disabled={isPending || downloading}
                className="rounded-md border border-border bg-white px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50 dark:bg-transparent"
              >
                {downloading ? t.downloading : t.downloadPdf}
              </button>
              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    disabled={isPending}
                    className="rounded-md border border-danger-border bg-white px-3 py-1 text-xs font-medium text-danger hover:bg-danger-soft disabled:opacity-50 dark:bg-transparent"
                  >
                    Undo / Void
                  </button>
                }
                title={`Void the ticket for ${lastSale.name}?`}
                description="This restores inventory + refunds payment if it was a card sale."
                confirmLabel="Void"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleVoid}
              />
            </div>
          </div>
        </div>
      )}

      {/* Event */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t.selectEvent}
        </label>
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

      {/* Tier */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t.selectTier}
        </label>
        <div className="space-y-2">
          {initialTiers.map((tier) => {
            const soldOut = tier.remaining !== null && tier.remaining <= 0;
            return (
              <label
                key={tier.id}
                className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                  tierId === tier.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                } ${soldOut ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tier_id"
                    value={tier.id}
                    checked={tierId === tier.id}
                    onChange={() => setTierId(tier.id)}
                    disabled={soldOut}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {soldOut
                        ? t.soldOut
                        : tier.remaining !== null
                          ? t.remaining.replace("{n}", String(tier.remaining))
                          : ""}
                    </p>
                  </div>
                </div>
                <p className="font-heading font-bold">
                  {tier.priceCents === 0
                    ? "\u2014"
                    : `\u20AC${(tier.priceCents / 100).toFixed(2)}`}
                </p>
              </label>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1.5">{t.name}</label>
        <input
          name="attendee_name"
          type="text"
          required
          value={attendeeName}
          onChange={(e) => setAttendeeName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Email — required so the ticket PDF + QR actually reach the buyer.
          Pre-2026-05-15 this was optional and the action silently invented
          a `door-sale-<ts>@no-email.local` placeholder; never again. */}
      <div>
        <label className="block text-sm font-medium mb-1.5">{t.email}</label>
        <input
          name="attendee_email"
          type="email"
          required
          value={attendeeEmail}
          onChange={(e) => setAttendeeEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t.emailHint}</p>
      </div>

      {/* Phone (advance mode) */}
      {mode === "advance" && (
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.phoneLbl}</label>
          <PhoneInput
            name="phone"
            value={phone}
            onChange={setPhone}
            size="sm"
            className="py-2 text-sm"
          />
        </div>
      )}

      {/* Payment method */}
      {mode === "advance" ? (
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.payment}</label>
          <input type="hidden" name="payment_method" value={paymentMethod} />
          <div className="flex gap-2">
            {(["cash", "sepa", "comp"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  paymentMethod === m
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "cash" ? t.cash : m === "sepa" ? t.bankTransfer : t.comp}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <input type="hidden" name="payment_method" value="cash" />
          {t.payment}: <strong className="text-foreground">{t.cash}</strong> &middot;
          {" "}{t.cashOnlyNote}
        </div>
      )}

      <Button type="submit"
        disabled={isPending || !tierId || !attendeeName.trim()}>
        {isPending ? t.creating : t.create}
      </Button>

      {/* Historic placeholder-email rows — collapsible, hidden when empty.
          Lets staff drop a real address on a pre-fix sale and trigger the
          delivery their buyer never got. */}
      {placeholderRows.length > 0 && (
        <PlaceholderBackfill rows={placeholderRows} locale={locale} t={t} />
      )}
    </form>
  );
}

function PlaceholderBackfill({
  rows,
  locale,
  t,
}: {
  rows: PlaceholderOrderRow[];
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    Record<string, "idle" | "sending" | "sent" | "error">
  >({});

  async function handleResend(ticketId: string) {
    const newEmail = (drafts[ticketId] ?? "").trim();
    if (!newEmail) return;
    setStatus((s) => ({ ...s, [ticketId]: "sending" }));
    const res = await updateAttendeeEmailAndResend(ticketId, newEmail, locale);
    if ("success" in res) {
      setStatus((s) => ({ ...s, [ticketId]: "sent" }));
      // Refresh so the row drops out of the next render.
      router.refresh();
    } else {
      setStatus((s) => ({ ...s, [ticketId]: "error" }));
    }
  }

  return (
    <details className="mt-8 rounded-md border border-warning-border bg-warning-soft/30 p-4">
      <summary className="cursor-pointer text-sm font-medium text-warning-strong">
        {t.placeholderBanner.replace("{n}", String(rows.length))}
      </summary>
      <table className="mt-4 min-w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-2 py-1 text-left">{t.placeholderColAttendee}</th>
            <th className="px-2 py-1 text-left">{t.placeholderColEvent}</th>
            <th className="px-2 py-1 text-left">{t.placeholderColEmail}</th>
            <th className="px-2 py-1 text-right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const s = status[r.ticket_id] ?? "idle";
            return (
              <tr key={r.ticket_id}>
                <td className="px-2 py-2">
                  <div className="font-medium">{r.attendee_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.attendee_email}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div>{r.event_title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.tier_name}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="email"
                    value={drafts[r.ticket_id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [r.ticket_id]: e.target.value,
                      }))
                    }
                    placeholder="buyer@example.com"
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  {s === "sent" ? (
                    <span className="text-xs text-success">
                      {t.placeholderSent}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleResend(r.ticket_id)}
                      disabled={
                        s === "sending" || !(drafts[r.ticket_id] ?? "").trim()
                      }
                      className="rounded-md border border-border bg-white px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50 dark:bg-transparent"
                    >
                      {s === "sending"
                        ? t.downloading
                        : s === "error"
                          ? t.placeholderResendErr
                          : t.placeholderResend}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
