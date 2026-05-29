"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AttendeeIdentityFields, Button, ConfirmDialog, EMPTY_ATTENDEE_IDENTITY, Input, PhoneInput, Select, TITLE_VALUES, type AttendeeIdentity, type AttendeeIdentityLabels, type Gender, type Title } from "@dbc/ui";
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

type PaymentMethod = "cash" | "sepa" | "comp";

// Persisted draft mirrors the AttendeeIdentity SSOT shape 1:1 so the form
// always rehydrates the same field set the molecule reads.
interface DoorSaleDraft {
  attendee: AttendeeIdentity;
  phone: string;
  showOptional: boolean;
  paymentMethod: PaymentMethod;
}

const STORAGE_KEY = "doorSaleDraft";

function loadDraft(): Partial<DoorSaleDraft> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
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
  const t = useTranslations("admin.doorSale");
  const tPerson = useTranslations("person");

  const [eventId, setEventId] = useState(initialEventId);
  const [tierId, setTierId] = useState(initialTiers[0]?.id ?? "");

  // Persist the form across the router.push() that fires when the operator
  // switches event (it reloads the page so React state would otherwise
  // reset). sessionStorage survives same-tab navigation.
  const draft = loadDraft();
  const [attendee, setAttendee] = useState<AttendeeIdentity>(
    draft.attendee ?? EMPTY_ATTENDEE_IDENTITY
  );
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [showOptional, setShowOptional] = useState(
    draft.showOptional ?? false
  );
  // "cash" + "sepa" are DB payment_method enum values. "comp" is a UX-only
  // pseudo-value the action translates to a NULL payment_method (for comped
  // tickets).
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    draft.paymentMethod ?? "cash"
  );
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

  // Persist draft on every change. Cheap (~few writes per keystroke); no
  // debounce needed at this volume.
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          attendee,
          phone,
          showOptional,
          paymentMethod,
        } satisfies DoorSaleDraft)
      );
    } catch {
      /* sessionStorage may be disabled — silently skip. */
    }
  }

  function clearDraft() {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }

  function handleEventChange(newEventId: string) {
    setEventId(newEventId);
    router.push(`?mode=${mode}&event=${newEventId}`);
  }

  async function handleDownloadPdf(orderId: string) {
    setDownloading(true);
    try {
      const res = await downloadDoorSaleTicketPdf(orderId, locale);
      if ("error" in res) {
        setResult({ error: res.error });
        return;
      }
      // Build a Blob from the base64 PDF and trigger a download. Standard
      // browser pattern — no extra deps. Object URL revoked after click so
      // we don't leak memory.
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

  function handleSubmit(formData: FormData) {
    const submittedName = [attendee.first_name, attendee.last_name]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    startTransition(async () => {
      const res = await createDoorSale(formData);
      setResult(res);
      if (res.success && res.orderId) {
        setLastSale({ orderId: res.orderId, name: submittedName });
        setAttendee(EMPTY_ATTENDEE_IDENTITY);
        setPhone("");
        setShowOptional(false);
        clearDraft();
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

  // Labels for the molecule — all sourced from JSON SSOT. `person.*` carries
  // the canonical identity labels (firstName, lastName, email, country, title,
  // gender, birthday, occupation, titleX, genderX). `admin.doorSale.*` carries
  // the door-sale-specific copy (email hint, country placeholder, "more
  // details" prefix, street/postal/city — which currently sit on person.* too).
  const titleLabels: Record<Title, string> = {
    mr: tPerson("titleMr"),
    ms: tPerson("titleMs"),
    mrs: tPerson("titleMrs"),
    mx: tPerson("titleMx"),
    dr: tPerson("titleDr"),
    prof: tPerson("titleProf"),
    excellency: tPerson("titleExcellency"),
    honourable: tPerson("titleHonourable"),
    rev: tPerson("titleRev"),
  };
  const genderLabels: Record<Gender, string> = {
    female: tPerson("genderFemale"),
    male: tPerson("genderMale"),
    non_binary: tPerson("genderNonBinary"),
    prefer_not_to_say: tPerson("genderPreferNotToSay"),
  };
  const labels: AttendeeIdentityLabels = {
    firstName: tPerson("firstName"),
    lastName: tPerson("lastName"),
    email: t("attendeeEmail"),
    emailHint: t("emailHint"),
    country: tPerson("country"),
    countryPlaceholder: t("countryPlaceholder"),
    addOptional: `+ ${tPerson("moreDetails")}`,
    hideOptional: `− ${tPerson("hideDetails")}`,
    optionalCaption: tPerson("optionalCaption"),
    title: tPerson("title"),
    gender: tPerson("gender"),
    birthday: tPerson("birthday"),
    occupation: tPerson("occupation"),
    streetAddress: tPerson("streetAddress"),
    addressLine2: tPerson("addressLine2"),
    postalCode: tPerson("postalCode"),
    city: tPerson("city"),
    titleOptions: titleLabels,
    genderOptions: genderLabels,
  };
  // Keep TITLE_VALUES referenced so the import isn't a lint warning — the
  // molecule's labels.titleOptions enforces a Record<Title, string> already,
  // which keeps us aligned with the enum if it changes.
  void TITLE_VALUES;

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
            <span>✓ {t("success")} — {lastSale.name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(lastSale.orderId)}
                disabled={isPending || downloading}
                className="rounded-md border border-border bg-white px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50 dark:bg-transparent"
              >
                {downloading ? t("downloading") : t("downloadPdf")}
              </button>
              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    disabled={isPending}
                    className="rounded-md border border-danger-border bg-white px-3 py-1 text-xs font-medium text-danger hover:bg-danger-soft disabled:opacity-50 dark:bg-transparent"
                  >
                    {t("undo")}
                  </button>
                }
                title={t("voidTitle", { name: lastSale.name })}
                description={t("voidDescription")}
                confirmLabel={t("voidConfirm")}
                cancelLabel={t("voidCancel")}
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
          {t("selectEvent")}
        </label>
        <Select
          value={eventId}
          onChange={(e) => handleEventChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
      </div>

      {/* Tier */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t("selectTier")}
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
                  <Input
                    type="radio"
                    name="tier_id"
                    value={tier.id}
                    checked={tierId === tier.id}
                    onChange={() => setTierId(tier.id)}
                    disabled={soldOut}
                  />
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {soldOut
                        ? t("soldOut")
                        : tier.remaining !== null
                          ? t("remaining", { n: tier.remaining })
                          : ""}
                    </p>
                  </div>
                </div>
                <p className="font-heading font-bold">
                  {tier.priceCents === 0
                    ? "—"
                    : `€${(tier.priceCents / 100).toFixed(2)}`}
                </p>
              </label>
            );
          })}
        </div>
      </div>

      {/* Attendee identity — single SSOT molecule. Same atoms, same order,
          same labels as the public checkout (apps/tickets/.../checkout-form),
          so the resulting contacts row + tickets.attendee_* columns are
          interchangeable. The molecule already covers Country, NameFields,
          Email, and the optional Title/Gender/Birthday/Occupation/Address
          collapse. No duplicate country, no state/region. */}
      <AttendeeIdentityFields
        value={attendee}
        onChange={setAttendee}
        locale={locale}
        showOptional={showOptional}
        onShowOptionalChange={setShowOptional}
        labels={labels}
      />

      {/* Phone — optional, advance mode only (no useful path at the till). */}
      {mode === "advance" && (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("phoneLabel")}
          </label>
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
          <label className="block text-sm font-medium mb-1.5">
            {t("payment")}
          </label>
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
                {m === "cash"
                  ? t("cash")
                  : m === "sepa"
                    ? t("bankTransfer")
                    : t("comp")}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <input type="hidden" name="payment_method" value="cash" />
          {t("payment")}: <strong className="text-foreground">{t("cash")}</strong>{" "}
          · {t("cashOnlyNote")}
        </div>
      )}

      <Button
        type="submit"
        disabled={
          isPending ||
          !tierId ||
          !attendee.first_name.trim() ||
          !attendee.last_name.trim() ||
          !attendee.email.trim() ||
          !attendee.country
        }
      >
        {isPending ? t("creating") : t("create")}
      </Button>

      {/* Historic placeholder-email rows — collapsible, hidden when empty.
          Lets staff drop a real address on a pre-fix sale and trigger the
          delivery their buyer never got. */}
      {placeholderRows.length > 0 && (
        <PlaceholderBackfill rows={placeholderRows} locale={locale} />
      )}
    </form>
  );
}

function PlaceholderBackfill({
  rows,
  locale,
}: {
  rows: PlaceholderOrderRow[];
  locale: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin.doorSale.placeholder");
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
      router.refresh();
    } else {
      setStatus((s) => ({ ...s, [ticketId]: "error" }));
    }
  }

  return (
    <details className="mt-8 rounded-md border border-warning-border bg-warning-soft/30 p-4">
      <summary className="cursor-pointer text-sm font-medium text-warning-strong">
        {t("banner", { n: rows.length })}
      </summary>
      <table className="mt-4 min-w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-2 py-1 text-left">{t("colAttendee")}</th>
            <th className="px-2 py-1 text-left">{t("colEvent")}</th>
            <th className="px-2 py-1 text-left">{t("colEmail")}</th>
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
                  <Input
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
                    <span className="text-xs text-success">{t("sent")}</span>
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
                        ? "…"
                        : s === "error"
                          ? t("error")
                          : t("resend")}
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
