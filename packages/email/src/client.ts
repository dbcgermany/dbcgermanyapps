import { Resend } from "resend";

let resendClient: Resend | null = null;

export function createEmailClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Default sender when no role-specific env var is set. During onboarding we
 * use Resend's shared `onboarding@resend.dev` sender which works without DNS.
 * Follow-up: switch to dedicated dbc-germany.com addresses after DKIM/SPF/
 * DMARC verification.
 */
export const DEFAULT_FROM = "DBC Germany <onboarding@resend.dev>";

/**
 * Pick the correct from-address for a given email role, falling back to the
 * shared Resend onboarding sender. Set these env vars per Vercel project to
 * switch to production senders:
 *   RESEND_FROM_ADDRESS           → transactional default (tickets, receipts)
 *   RESEND_NEWSLETTER_FROM        → marketing broadcasts
 *   RESEND_STAFF_FROM_ADDRESS     → staff-to-contact messages
 */
export function fromAddressFor(
  role: "transactional" | "newsletter" | "staff"
): string {
  switch (role) {
    case "newsletter":
      return (
        process.env.RESEND_NEWSLETTER_FROM ??
        process.env.RESEND_FROM_ADDRESS ??
        DEFAULT_FROM
      );
    case "staff":
      return (
        process.env.RESEND_STAFF_FROM_ADDRESS ??
        process.env.RESEND_FROM_ADDRESS ??
        DEFAULT_FROM
      );
    case "transactional":
    default:
      return process.env.RESEND_FROM_ADDRESS ?? DEFAULT_FROM;
  }
}
