"use client";

import {
  STRIPE_PAYMENT_METHOD_TYPE_VALUES,
  type StripePaymentMethodType,
} from "@dbc/types";

// Friendly labels for the Stripe `payment_method_types` values we offer.
// These map 1:1 with the canonical Stripe strings — the value attribute
// posted to the server is the Stripe-exact string, so the updateEvent
// action can pass it straight to Stripe without any translation.
const LABELS: Record<StripePaymentMethodType, string> = {
  card: "Card (incl. Apple Pay / Google Pay)",
  sepa_debit: "SEPA Debit",
  paypal: "PayPal",
  klarna: "Klarna",
  link: "Link",
  bancontact: "Bancontact (BE)",
  eps: "EPS (AT)",
  ideal: "iDEAL (NL)",
  amazon_pay: "Amazon Pay",
  mb_way: "MB Way (PT)",
};

const T = {
  en: {
    heading: "Payment methods offered at checkout",
    help: "Leave everything unchecked to use whichever methods are active in your Stripe Dashboard — safest default. Selecting any method here whitelists only those ones. Each method must also be activated in Stripe, or the session creation fails.",
  },
  de: {
    heading: "Zahlungsmethoden im Checkout",
    help: "Nichts auswählen = die in deinem Stripe-Dashboard aktiven Methoden werden genutzt (sicherste Einstellung). Wenn du hier Methoden wählst, werden nur diese erlaubt. Jede gewählte Methode muss zusätzlich in Stripe aktiviert sein, sonst schlägt die Session fehl.",
  },
  fr: {
    heading: "Méthodes de paiement au checkout",
    help: "Ne rien cocher = Stripe utilise les méthodes actives dans ton Dashboard (paramètre le plus sûr). Cocher ici restreint aux méthodes sélectionnées. Chaque méthode doit aussi être activée dans Stripe, sinon la session échoue.",
  },
} as const;

export function PaymentMethodsSelect({
  name = "enabled_payment_methods",
  initialValues = [],
  locale,
}: {
  name?: string;
  initialValues?: string[];
  locale: string;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const initial = new Set(initialValues);

  return (
    <fieldset>
      <legend className="text-sm font-medium mb-2">{t.heading}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STRIPE_PAYMENT_METHOD_TYPE_VALUES.map((value) => (
          <label
            key={value}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted cursor-pointer"
          >
            <input
              type="checkbox"
              name={name}
              value={value}
              defaultChecked={initial.has(value)}
              className="accent-primary"
            />
            <span>{LABELS[value]}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t.help}</p>
    </fieldset>
  );
}
