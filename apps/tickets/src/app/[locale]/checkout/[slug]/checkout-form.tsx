"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import Script from "next/script";
import { createCheckoutSession } from "@/actions/purchase";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
}

interface Attendee {
  name: string;
  email: string;
  tierId: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        selector: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function CheckoutForm({
  eventSlug,
  locale,
  tiers,
  maxPerOrder,
  turnstileSiteKey,
}: {
  eventSlug: string;
  locale: string;
  tiers: Tier[];
  maxPerOrder: number;
  turnstileSiteKey: string | null;
}) {
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "", tierId: tiers[0]?.id ?? "" },
  ]);
  const [couponCode, setCouponCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (!turnstileRef.current) return;

    function renderWidget() {
      if (!window.turnstile || !turnstileRef.current) return;
      if (turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileRef.current,
        {
          sitekey: turnstileSiteKey!,
          callback: (token: string) => setTurnstileToken(token),
          "error-callback": () => setTurnstileToken(null),
          "expired-callback": () => setTurnstileToken(null),
          theme: "auto",
        }
      );
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [turnstileSiteKey]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null) => {
      for (let i = 0; i < attendees.length; i++) {
        if (!attendees[i].name.trim() || !attendees[i].email.trim()) {
          return {
            error: `Please fill in name and email for ticket ${i + 1}.`,
          };
        }
      }

      if (turnstileSiteKey && !turnstileToken) {
        return {
          error:
            locale === "de"
              ? "Bitte best\u00e4tigen Sie, dass Sie kein Bot sind."
              : locale === "fr"
                ? "Veuillez confirmer que vous n'\u00eates pas un robot."
                : "Please complete the bot check.",
        };
      }

      const result = await createCheckoutSession({
        eventSlug,
        attendees,
        couponCode: couponCode.trim() || undefined,
        locale,
        turnstileToken: turnstileToken ?? undefined,
      });

      // Reset widget after submission so retries get a fresh token.
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
        setTurnstileToken(null);
      }

      return result;
    },
    null
  );

  function addAttendee() {
    if (attendees.length >= maxPerOrder) return;
    setAttendees([
      ...attendees,
      { name: "", email: "", tierId: tiers[0]?.id ?? "" },
    ]);
  }

  function removeAttendee(index: number) {
    if (attendees.length <= 1) return;
    setAttendees(attendees.filter((_, i) => i !== index));
  }

  function updateAttendee(
    index: number,
    field: keyof Attendee,
    value: string
  ) {
    setAttendees(
      attendees.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  // Compute subtotal
  const tierMap = new Map(tiers.map((t) => [t.id, t]));
  const subtotalCents = attendees.reduce((sum, a) => {
    const tier = tierMap.get(a.tierId);
    return sum + (tier?.priceCents ?? 0);
  }, 0);

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Attendees */}
      <div className="space-y-6">
        {attendees.map((attendee, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {locale === "de"
                  ? `Ticket ${index + 1} von ${attendees.length}`
                  : locale === "fr"
                    ? `Billet ${index + 1} sur ${attendees.length}`
                    : `Ticket ${index + 1} of ${attendees.length}`}
              </h3>
              {attendees.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAttendee(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {locale === "de" ? "Entfernen" : locale === "fr" ? "Supprimer" : "Remove"}
                </button>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {locale === "de" ? "Ticketart" : locale === "fr" ? "Type de billet" : "Ticket type"}
                </label>
                <select
                  value={attendee.tierId}
                  onChange={(e) =>
                    updateAttendee(index, "tierId", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} &mdash; {tier.priceCents === 0 ? (locale === "de" ? "Kostenlos" : locale === "fr" ? "Gratuit" : "Free") : `\u20AC${(tier.priceCents / 100).toFixed(2)}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {locale === "de" ? "Name" : locale === "fr" ? "Nom" : "Name"}
                </label>
                <input
                  type="text"
                  required
                  value={attendee.name}
                  onChange={(e) =>
                    updateAttendee(index, "name", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {locale === "de" ? "E-Mail" : locale === "fr" ? "E-mail" : "Email"}
                </label>
                <input
                  type="email"
                  required
                  value={attendee.email}
                  onChange={(e) =>
                    updateAttendee(index, "email", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        ))}

        {attendees.length < maxPerOrder && (
          <button
            type="button"
            onClick={addAttendee}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            + {locale === "de" ? "Weiteres Ticket hinzuf\u00fcgen" : locale === "fr" ? "Ajouter un billet" : "Add another ticket"}
          </button>
        )}
      </div>

      {/* Coupon */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {locale === "de" ? "Gutscheincode" : locale === "fr" ? "Code promo" : "Coupon code"}
        </label>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder={
            locale === "de"
              ? "Gutscheincode eingeben"
              : locale === "fr"
                ? "Entrer le code promo"
                : "Enter coupon code"
          }
          className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Order Summary */}
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-heading text-lg font-semibold">
          {locale === "de" ? "Zusammenfassung" : locale === "fr" ? "R\u00e9sum\u00e9" : "Summary"}
        </h3>
        <div className="mt-4 space-y-2 text-sm">
          {attendees.map((a, i) => {
            const tier = tierMap.get(a.tierId);
            return (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">
                  {tier?.name} {a.name && `\u2014 ${a.name}`}
                </span>
                <span>
                  {tier
                    ? tier.priceCents === 0
                      ? locale === "de" ? "Kostenlos" : locale === "fr" ? "Gratuit" : "Free"
                      : `\u20AC${(tier.priceCents / 100).toFixed(2)}`
                    : ""}
                </span>
              </div>
            );
          })}
          <div className="border-t border-border pt-2 flex justify-between font-medium text-base">
            <span>Total</span>
            <span>
              {subtotalCents === 0
                ? locale === "de" ? "Kostenlos" : locale === "fr" ? "Gratuit" : "Free"
                : `\u20AC${(subtotalCents / 100).toFixed(2)}`}
            </span>
          </div>
          {couponCode.trim() && (
            <p className="text-xs text-muted-foreground">
              {locale === "de"
                ? "Gutschein wird beim Bezahlen angewendet"
                : locale === "fr"
                  ? "Le coupon sera appliqu\u00e9 au paiement"
                  : "Coupon will be applied at payment"}
            </p>
          )}
        </div>
      </div>

      {/* Turnstile */}
      {turnstileSiteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div ref={turnstileRef} className="flex justify-center" />
        </>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || (Boolean(turnstileSiteKey) && !turnstileToken)}
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending
          ? locale === "de"
            ? "Verarbeitung..."
            : locale === "fr"
              ? "Traitement..."
              : "Processing..."
          : subtotalCents === 0
            ? locale === "de"
              ? "Kostenlos bestellen"
              : locale === "fr"
                ? "Commander gratuitement"
                : "Complete free order"
            : locale === "de"
              ? `\u20AC${(subtotalCents / 100).toFixed(2)} bezahlen`
              : locale === "fr"
                ? `Payer \u20AC${(subtotalCents / 100).toFixed(2)}`
                : `Pay \u20AC${(subtotalCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
