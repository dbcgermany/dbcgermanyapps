"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@dbc/ui";
import { createDoorSale, voidDoorSale } from "@/actions/door-sale";

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
}: {
  locale: string;
  mode: "door" | "advance";
  events: { id: string; title: string }[];
  initialEventId: string;
  initialTiers: Tier[];
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState(initialEventId);
  const [tierId, setTierId] = useState(initialTiers[0]?.id ?? "");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [phone, setPhone] = useState("");
  // "cash" + "sepa" are DB payment_method enum values. "comp" is a UX-only
  // pseudo-value the action translates to a NULL payment_method (for comped
  // tickets). Prior bug: this state used "bank_transfer", which isn't in
  // the DB enum — any submission with that value failed the insert.
  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "sepa" | "comp">("cash");
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

  function handleEventChange(newEventId: string) {
    setEventId(newEventId);
    // Navigate to reload tiers for the new event, preserve mode
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
        // Refresh to update tier remaining counts
        router.refresh();
      }
    });
  }

  function handleVoid() {
    if (!lastSale) return;
    if (!confirm(`Void the ticket for ${lastSale.name}? This restores inventory.`)) return;
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
      email: "Attendee email (optional)",
      phoneLbl: "Phone (optional)",
      payment: "Payment method",
      cash: "Cash",
      bankTransfer: "Bank transfer",
      comp: "Complimentary",
      create: "Create ticket",
      success: "Ticket created. Ready for entry.",
      creating: "Creating...",
      soldOut: "Sold out",
      remaining: "{n} remaining",
      cashOnlyNote: "Card buyers should scan the online-purchase poster.",
    },
    de: {
      selectEvent: "Veranstaltung",
      selectTier: "Ticketart",
      name: "Name des Teilnehmers",
      email: "E-Mail des Teilnehmers (optional)",
      phoneLbl: "Telefon (optional)",
      payment: "Zahlungsmethode",
      cash: "Bar",
      bankTransfer: "\u00DCberweisung",
      comp: "Kostenlos",
      create: "Ticket erstellen",
      success: "Ticket erstellt. Bereit f\u00FCr den Einlass.",
      creating: "Wird erstellt...",
      soldOut: "Ausverkauft",
      remaining: "Noch {n}",
      cashOnlyNote: "Kartenzahler sollten den Online-Kaufposter scannen.",
    },
    fr: {
      selectEvent: "\u00C9v\u00E9nement",
      selectTier: "Type de billet",
      name: "Nom du participant",
      email: "E-mail du participant (optionnel)",
      phoneLbl: "T\u00E9l\u00E9phone (optionnel)",
      payment: "Mode de paiement",
      cash: "Esp\u00E8ces",
      bankTransfer: "Virement",
      comp: "Gratuit",
      create: "Cr\u00E9er le billet",
      success: "Billet cr\u00E9\u00E9. Pr\u00EAt pour l\u2019entr\u00E9e.",
      creating: "Cr\u00E9ation...",
      soldOut: "\u00C9puis\u00E9",
      remaining: "{n} restants",
      cashOnlyNote: "Les acheteurs par carte doivent scanner l\u2019affiche d\u2019achat en ligne.",
    },
  }[locale] ?? {
    selectEvent: "Event", selectTier: "Tier", name: "Name", email: "Email", phoneLbl: "Phone",
    payment: "Payment", cash: "Cash", bankTransfer: "Transfer", comp: "Comp",
    create: "Create", success: "Done", creating: "...", soldOut: "Sold out",
    remaining: "{n} left", cashOnlyNote: "Card buyers scan the poster.",
  };

  return (
    <form action={handleSubmit} className="mt-6 space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="event_id" value={eventId} />

      {result.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {result.error}
        </div>
      )}
      {result.success && lastSale && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <div className="flex items-center justify-between gap-4">
            <span>
              &#x2713; {t.success} &mdash; {lastSale.name}
            </span>
            <button
              type="button"
              onClick={handleVoid}
              disabled={isPending}
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:bg-transparent"
            >
              Undo / Void
            </button>
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

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1.5">{t.email}</label>
        <input
          name="attendee_email"
          type="email"
          value={attendeeEmail}
          onChange={(e) => setAttendeeEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
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

      <button
        type="submit"
        disabled={isPending || !tierId || !attendeeName.trim()}
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.creating : t.create}
      </button>
    </form>
  );
}
