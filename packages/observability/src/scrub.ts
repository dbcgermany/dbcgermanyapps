import type { Event as SentryEvent, EventHint } from "@sentry/nextjs";

// Sentry v10 split init's beforeSend / beforeSendTransaction into ErrorEvent
// and TransactionEvent. Neither is re-exported from @sentry/nextjs's barrel,
// but both extend the loose `Event` type that IS exported. We declare the
// scrubber as a generic over a sub-shape so both call sites (.beforeSend +
// .beforeSendTransaction) accept it without the narrower type complaining.
type ScrubableEvent = SentryEvent;

// PII scrubbing for Sentry events. The conference handles ~1k attendees with
// names, emails, addresses + buyer phone in some flows. We do NOT want any
// of that in Sentry (GDPR — Sentry is a US-or-EU SaaS but the data minimisation
// principle applies regardless). At the same time the operator needs ENOUGH
// context to debug — order_id, tier_id, stripe_*, status, locale, route — so
// we redact selectively rather than scorched-earth.
//
// Strategy:
//   - Email-shaped strings get hashed (deterministic 8-char sha256) so the
//     same buyer emailing twice produces the same `[email:abc12345]` token,
//     letting the operator correlate without seeing the address.
//   - Known PII keys (recipient_name, attendee_email, phone, …) become
//     `[redacted]` regardless of value.
//   - ID-shaped keys (anything ending in `_id`, plus stripe + supabase
//     prefixes) are preserved as-is.

const EMAIL_RE = /([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

const PII_KEYS = new Set([
  "email",
  "phone",
  "phone_number",
  "name",
  "full_name",
  "first_name",
  "last_name",
  "buyer_name",
  "buyer_email",
  "recipient_email",
  "recipient_name",
  "recipient_first_name",
  "recipient_last_name",
  "recipient_title",
  "attendee_email",
  "attendee_name",
  "attendee_first_name",
  "attendee_last_name",
  "attendee_title",
  "attendee_birthday",
  "address",
  "ip",
  "ip_address",
  "marketing_consent_ip",
  "revocation_waived_ip",
]);

const PRESERVE_PREFIXES = ["stripe_", "pi_", "cs_", "ch_", "prod_", "price_", "sub_", "in_", "evt_"];

// FNV-1a 32-bit. Isomorphic (works in browser + Node + edge) and deterministic
// — same email always produces the same 8-char tag. Not cryptographic, but the
// goal here is correlation, not secrecy: the original email never leaves our
// process and the hash only exists to let an operator group repeat events from
// the same buyer in Sentry without seeing the address.
function hashEmail(email: string): string {
  let h = 0x811c9dc5;
  const lower = email.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    h ^= lower.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const tag = (h >>> 0).toString(16).padStart(8, "0");
  return `[email:${tag}]`;
}

function maskEmails(input: string): string {
  return input.replace(EMAIL_RE, (m) => hashEmail(m));
}

function shouldPreserve(key: string): boolean {
  if (key.endsWith("_id") || key === "id") return true;
  return PRESERVE_PREFIXES.some((p) => key.startsWith(p));
}

function isPiiKey(key: string): boolean {
  return PII_KEYS.has(key.toLowerCase());
}

type Walkable = unknown;

function scrubValue(value: Walkable, depth = 0): Walkable {
  if (depth > 8) return value;
  if (value == null) return value;
  if (typeof value === "string") return maskEmails(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isPiiKey(k)) {
        out[k] = "[redacted]";
        continue;
      }
      if (shouldPreserve(k)) {
        out[k] = v;
        continue;
      }
      out[k] = scrubValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function scrubPii<E extends ScrubableEvent>(
  event: E,
  _hint?: EventHint
): E | null {
  // Drop all `user` PII (set by Sentry SDK or by us). We don't want
  // username, email, ip_address or geo on events.
  if (event.user) {
    event.user = { id: event.user.id ?? undefined };
  }

  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    if (event.request.data) event.request.data = scrubValue(event.request.data) as typeof event.request.data;
    if (event.request.query_string && typeof event.request.query_string === "string") {
      event.request.query_string = maskEmails(event.request.query_string);
    }
  }

  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  }
  if (event.extra) {
    event.extra = scrubValue(event.extra) as typeof event.extra;
  }
  if (event.tags) {
    const cleanTags: Record<string, string> = {};
    for (const [k, v] of Object.entries(event.tags)) {
      if (isPiiKey(k)) continue;
      cleanTags[k] = typeof v === "string" ? maskEmails(v) : String(v);
    }
    event.tags = cleanTags;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({
      ...b,
      message: b.message ? maskEmails(b.message) : b.message,
      data: b.data ? (scrubValue(b.data) as typeof b.data) : b.data,
    }));
  }

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((v) => ({
      ...v,
      value: v.value ? maskEmails(v.value) : v.value,
    }));
  }

  if (event.message) {
    event.message =
      typeof event.message === "string"
        ? maskEmails(event.message)
        : event.message;
  }

  return event;
}
