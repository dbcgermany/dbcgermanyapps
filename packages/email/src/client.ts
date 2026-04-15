import { Resend } from "resend";

let resendClient: Resend | null = null;

export function createEmailClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Default sender used until the `dbc-germany.com` domain is verified in
 * Resend. Resend's shared `onboarding@resend.dev` sender is the safe
 * fallback — it only delivers to the Resend account owner but it never
 * 550s. After verification, setting the env vars below flips every email
 * to the production address without a code change.
 */
export const DEFAULT_FROM = "DBC Germany <onboarding@resend.dev>";

/**
 * The production sender matrix (only used when the corresponding env var
 * is set; otherwise we fall back to DEFAULT_FROM):
 *
 *   tickets        → tickets@dbc-germany.com    — ticket delivery + order receipts
 *   newsletter     → newsletter@dbc-germany.com — broadcast campaigns
 *   transactional  → noreply@dbc-germany.com    — admin alerts, transfers,
 *                                                  waitlist, staff-to-contact
 *                                                  (staff gets reply-to set to
 *                                                  the staff member's mailbox
 *                                                  so replies reach Google).
 *   password       → Password@dbc-germany.com   — Supabase Auth (configured
 *                                                  in the Supabase dashboard,
 *                                                  NOT in this code).
 *
 * All four addresses live on the Resend side only. Every other
 * `@dbc-germany.com` mailbox (info@, sales@, marketing@, community@, …)
 * stays on Google Workspace; this code never sends from them.
 *
 * Env var names:
 *   RESEND_FROM_ADDRESS      → transactional default (noreply)
 *   RESEND_TICKETS_FROM      → ticket delivery + order receipts
 *   RESEND_NEWSLETTER_FROM   → marketing broadcasts
 *   RESEND_STAFF_FROM_ADDRESS → OPTIONAL override for staff-to-contact;
 *                               defaults to RESEND_FROM_ADDRESS (noreply)
 */
export function fromAddressFor(
  role: "transactional" | "tickets" | "newsletter" | "staff"
): string {
  switch (role) {
    case "tickets":
      return (
        process.env.RESEND_TICKETS_FROM ??
        process.env.RESEND_FROM_ADDRESS ??
        DEFAULT_FROM
      );
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
