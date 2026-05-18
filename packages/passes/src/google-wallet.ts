import jwt from "jsonwebtoken";

/**
 * Google Wallet "Add to Wallet" link builder.
 *
 * Generates a signed JWT that wraps an EventTicketObject (and its inline
 * EventTicketClass) and returns the canonical save URL. When the user opens
 * the URL on Android, Chrome offers an "Add to Google Wallet" sheet; on iOS
 * Safari it gracefully degrades to the web Wallet page.
 *
 * Setup-free for development: as long as DBC's Google Wallet issuer is in
 * DEMO state, the inline class travels with the JWT and no class-registration
 * REST call is needed. For production (issuer approved), the class id must
 * point to a pre-registered class — switch to that mode by passing
 * `useRegisteredClass: true` once the registration is in place.
 *
 * Env vars (server-side only):
 *   GOOGLE_WALLET_ISSUER_ID         numeric issuer id from Google Pay & Wallet Console
 *   GOOGLE_WALLET_SERVICE_ACCOUNT   service-account email (for JWT `iss`)
 *   GOOGLE_WALLET_PRIVATE_KEY       PEM private key (paste with literal \n line breaks)
 *
 * When any of those is unset, `googleWalletConfigured()` returns false and
 * callers should hide the "Add to Wallet" button gracefully.
 */

export interface GoogleWalletConfig {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string; // PEM, may include literal \n that we expand
}

export interface EventTicketClassInput {
  eventName: { en: string; de?: string; fr?: string };
  venueName: string;
  venueAddress: string;
  startIso: string; // ISO 8601, e.g. "2026-06-13T10:00:00Z"
  endIso: string;
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "DE"
  /** Public HTTPS URL to the event logo (square, transparent PNG ≥ 660×660). */
  logoUrl?: string;
  /** Public HTTPS URL to the hero/banner image (1032×336). */
  heroImageUrl?: string;
  hexBackgroundColor?: string;
  /** Stable per-event slug — becomes the suffix on the class id. */
  classSuffix: string;
}

export interface EventTicketObjectInput {
  /** Unique per-ticket suffix (e.g. ticket UUID). */
  objectSuffix: string;
  ticketHolderName: string;
  /** Short, human-readable ticket id printed on the pass (e.g. "ABCD1234"). */
  ticketNumber: string;
  /** Tier display name — "VIP", "Premium", "Starter", etc. */
  ticketTier: string;
  /** Raw value encoded in the pass QR — keep this == the existing ticket_token
   *  so the existing scanner code in admin needs zero changes. */
  qrValue: string;
}

/** Returns true when all three required env vars are present. */
export function googleWalletConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY
  );
}

function loadConfig(): GoogleWalletConfig {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT;
  const rawKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  if (!issuerId || !serviceAccountEmail || !rawKey) {
    throw new Error(
      "Google Wallet not configured — set GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT, GOOGLE_WALLET_PRIVATE_KEY."
    );
  }
  // Vercel env vars commonly arrive with literal \n escape sequences instead
  // of real newlines. Normalise so jsonwebtoken's RS256 signer accepts it.
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { issuerId, serviceAccountEmail, privateKey };
}

function buildClassPayload(
  input: EventTicketClassInput,
  issuerId: string
): Record<string, unknown> {
  const localizedString = (en: string, de?: string, fr?: string) => {
    const translations: Array<{ language: string; value: string }> = [];
    if (de) translations.push({ language: "de", value: de });
    if (fr) translations.push({ language: "fr", value: fr });
    return {
      defaultValue: { language: "en", value: en },
      ...(translations.length > 0
        ? { translatedValues: translations }
        : {}),
    };
  };

  return {
    id: `${issuerId}.${input.classSuffix}`,
    issuerName: "DBC Germany",
    reviewStatus: "UNDER_REVIEW",
    eventName: localizedString(
      input.eventName.en,
      input.eventName.de,
      input.eventName.fr
    ),
    venue: {
      name: { defaultValue: { language: "en", value: input.venueName } },
      address: {
        defaultValue: { language: "en", value: input.venueAddress },
      },
    },
    dateTime: {
      start: input.startIso,
      end: input.endIso,
    },
    countryCode: input.countryCode,
    ...(input.logoUrl
      ? {
          logo: {
            sourceUri: { uri: input.logoUrl },
            contentDescription: {
              defaultValue: { language: "en", value: "DBC Germany" },
            },
          },
        }
      : {}),
    ...(input.heroImageUrl
      ? {
          heroImage: {
            sourceUri: { uri: input.heroImageUrl },
            contentDescription: {
              defaultValue: { language: "en", value: input.eventName.en },
            },
          },
        }
      : {}),
    ...(input.hexBackgroundColor
      ? { hexBackgroundColor: input.hexBackgroundColor }
      : {}),
  };
}

function buildObjectPayload(
  input: EventTicketObjectInput,
  classId: string,
  issuerId: string
): Record<string, unknown> {
  return {
    id: `${issuerId}.${input.objectSuffix}`,
    classId,
    state: "ACTIVE",
    ticketHolderName: input.ticketHolderName,
    ticketNumber: input.ticketNumber,
    ticketType: {
      defaultValue: { language: "en", value: input.ticketTier },
    },
    barcode: {
      type: "QR_CODE",
      value: input.qrValue,
      alternateText: input.ticketNumber,
    },
  };
}

/**
 * Build the `https://pay.google.com/gp/v/save/<JWT>` URL for one attendee.
 *
 * The JWT carries both the EventTicketClass (inline, so no pre-registration
 * is required while the issuer is in DEMO) and the EventTicketObject for the
 * specific attendee. The JWT is short — Google Wallet links are typically
 * 1.5–3 KB which fits comfortably below the 2048-char URL ceiling on all
 * mainstream email clients and browsers.
 */
export function buildAddToGoogleWalletUrl(
  klass: EventTicketClassInput,
  object: EventTicketObjectInput
): string {
  const cfg = loadConfig();
  const classPayload = buildClassPayload(klass, cfg.issuerId);
  const objectPayload = buildObjectPayload(
    object,
    classPayload.id as string,
    cfg.issuerId
  );

  const jwtPayload = {
    iss: cfg.serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      eventTicketClasses: [classPayload],
      eventTicketObjects: [objectPayload],
    },
  };

  const token = jwt.sign(jwtPayload, cfg.privateKey, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
