import { randomBytes } from "node:crypto";

// 32 bytes = 256 bits of cryptographic randomness. URL-safe base64 (no
// padding) yields ~43 chars. With the `aff_` prefix the final length is
// well within URL limits and bot enumeration is computationally infeasible.

export function generateDashboardToken(): string {
  const buf = randomBytes(32);
  const b64 = buf.toString("base64url");
  return `aff_${b64}`;
}

// Short trackable tag used in the `?src=aff_xxxx` query param on the
// referral URL. Not a secret — purely for analytics differentiation
// when the same coupon could otherwise be shared via multiple channels.
export function generateTrackingTag(): string {
  return randomBytes(4).toString("base64url");
}
