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

/**
 * Reply-to inbox matrix. Mirrors `fromAddressFor()`'s scope split so callers
 * can pass the same `role` they use for `from:`. Templates routinely say
 * things like "if you didn't expect this, reply to this email" — but the
 * from-address is `noreply@` / `tickets@`, so without an explicit replyTo
 * the message bounces. This helper threads a real human-monitored inbox
 * through every transactional + ticket send.
 *
 * Routing (admin-configurable per Vercel env):
 *   tickets        → sales@dbc-germany.com  — ticket transfer, refund, order
 *                                              receipt, payment reminder,
 *                                              ticket delivery, ask-speakers
 *   transactional  → info@dbc-germany.com   — everything else (admin alerts,
 *                                              waitlist, chapter-delegate
 *                                              invites + outcomes, staff
 *                                              account events, newsletter
 *                                              confirm, team-friend redeemed)
 *
 * Hardcoded defaults keep replies landing on the right inbox even if the
 * Vercel env vars aren't set; the env vars only need to change when you
 * want to point a category somewhere else without a deploy.
 */
export function replyToAddressFor(
  role: "transactional" | "tickets"
): string {
  if (role === "tickets") {
    return process.env.RESEND_REPLY_TO_TICKETS ?? "sales@dbc-germany.com";
  }
  return process.env.RESEND_REPLY_TO ?? "info@dbc-germany.com";
}
