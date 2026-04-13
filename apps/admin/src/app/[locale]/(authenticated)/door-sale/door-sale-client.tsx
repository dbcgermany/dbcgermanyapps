"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDoorSale } from "@/actions/door-sale";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
  remaining: number | null;
}

export function DoorSaleClient({
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
  const [eventId, setEventId] = useState(initialEventId);
  const [tierId, setTierId] = useState(initialTiers[0]?.id ?? "");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [result, setResult] = useState<{ error?: string; success?: boolean }>(
    {}
  );
  const [isPending, startTransition] = useTransition();

  function handleEventChange(newEventId: string) {
    setEventId(newEventId);
    // Navigate to reload tiers for the new event
    router.push(`?event=${newEventId}`);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createDoorSale(formData);
      setResult(res);
      if (res.success) {
        setAttendeeName("");
        setAttendeeEmail("");
        // Refresh to update tier remaining counts
        router.refresh();
      }
    });
  }

  const t = {
    en: {
      selectEvent: "Event",
      selectTier: "Ticket tier",
      name: "Attendee name",
      email: "Attendee email (optional)",
      payment: "Payment method",
      cash: "Cash",
      card: "Card (terminal)",
      create: "Create ticket",
      success: "Ticket created. Ready for entry.",
      creating: "Creating...",
      soldOut: "Sold out",
      remaining: "{n} remaining",
    },
    de: {
      selectEvent: "Veranstaltung",
      selectTier: "Ticketart",
      name: "Name des Teilnehmers",
      email: "E-Mail des Teilnehmers (optional)",
      payment: "Zahlungsmethode",
      cash: "Bar",
      card: "Karte (Terminal)",
      create: "Ticket erstellen",
      success: "Ticket erstellt. Bereit f\u00FCr den Einlass.",
      creating: "Wird erstellt...",
      soldOut: "Ausverkauft",
      remaining: "Noch {n}",
    },
    fr: {
      selectEvent: "\u00C9v\u00E9nement",
      selectTier: "Type de billet",
      name: "Nom du participant",
      email: "E-mail du participant (optionnel)",
      payment: "M\u00E9thode de paiement",
      cash: "Esp\u00E8ces",
      card: "Carte (terminal)",
      create: "Cr\u00E9er le billet",
      success: "Billet cr\u00E9\u00E9. Pr\u00EAt pour l\u2019entr\u00E9e.",
      creating: "Cr\u00E9ation...",
      soldOut: "\u00C9puis\u00E9",
      remaining: "{n} restants",
    },
  }[locale] ?? {
    selectEvent: "Event", selectTier: "Tier", name: "Name", email: "Email", payment: "Payment", cash: "Cash", card: "Card", create: "Create", success: "Done", creating: "...", soldOut: "Sold out", remaining: "{n} left",
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
      {result.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          &#x2713; {t.success}
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

      {/* Payment method */}
      <div>
        <label className="block text-sm font-medium mb-1.5">{t.payment}</label>
        <div className="flex gap-3">
          {[
            { value: "cash", label: t.cash },
            { value: "card", label: t.card },
          ].map((pm) => (
            <label
              key={pm.value}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md border p-3 cursor-pointer transition-colors ${
                paymentMethod === pm.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={pm.value}
                checked={paymentMethod === pm.value}
                onChange={() => setPaymentMethod(pm.value)}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{pm.label}</span>
            </label>
          ))}
        </div>
      </div>

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
