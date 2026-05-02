import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import type Stripe from "stripe";
import {
  STRIPE_PAYMENT_METHOD_TYPE_VALUES,
  type StripePaymentMethodType,
} from "@dbc/types";

// Stripe Account.capabilities key -> Checkout payment_method_types value.
// Methods without a per-account capability gate (link, bancontact, eps,
// ideal, amazon_pay, mb_way) are always offered; Stripe filters at session
// creation if they're not eligible for the currency/country/amount.
const CAPABILITY_TO_METHOD: Record<string, StripePaymentMethodType> = {
  card_payments: "card",
  klarna_payments: "klarna",
  sepa_debit_payments: "sepa_debit",
  paypal_payments: "paypal",
};

const ALWAYS_ALLOW: readonly StripePaymentMethodType[] = [
  "link",
  "bancontact",
  "eps",
  "ideal",
  "amazon_pay",
  "mb_way",
];

const CACHE_TTL_SECONDS = 300;

function keyFingerprint(): string {
  const k = process.env.STRIPE_SECRET_KEY ?? "";
  return createHash("sha256").update(k).digest("hex").slice(0, 16);
}

async function fetchActive(
  stripe: Stripe
): Promise<StripePaymentMethodType[]> {
  // Passing null retrieves the account that owns the API key being used
  // (SDK 22 requires an explicit first arg).
  const account = await stripe.accounts.retrieve(null);
  const caps = (account.capabilities ?? {}) as Record<string, string>;
  const active = new Set<StripePaymentMethodType>();
  for (const [capKey, methodKey] of Object.entries(CAPABILITY_TO_METHOD)) {
    if (caps[capKey] === "active") active.add(methodKey);
  }
  for (const m of ALWAYS_ALLOW) active.add(m);
  return [...active].filter((m): m is StripePaymentMethodType =>
    (STRIPE_PAYMENT_METHOD_TYPE_VALUES as readonly string[]).includes(m)
  );
}

export async function getActivePaymentMethodTypes(
  stripe: Stripe
): Promise<StripePaymentMethodType[]> {
  const cached = unstable_cache(
    () => fetchActive(stripe),
    [`stripe-capabilities:${keyFingerprint()}`],
    { revalidate: CACHE_TTL_SECONDS, tags: ["stripe:capabilities"] }
  );
  try {
    return await cached();
  } catch (err) {
    console.error("[stripe-capabilities] retrieve failed:", err);
    return ["card"];
  }
}

export function filterToActive(
  requested: readonly string[],
  active: readonly StripePaymentMethodType[]
): StripePaymentMethodType[] {
  if (requested.length === 0) return [...active];
  const activeSet = new Set(active);
  return requested.filter((r): r is StripePaymentMethodType =>
    activeSet.has(r as StripePaymentMethodType)
  );
}
