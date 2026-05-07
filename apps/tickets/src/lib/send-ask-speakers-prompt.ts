import type { SupabaseClient } from "@supabase/supabase-js";
import { sendAskSpeakersEmail } from "@dbc/email";
import { captureServerError } from "@/lib/observe";

interface SpeakerJoinRow {
  role_label_en: string | null;
  role_label_de: string | null;
  role_label_fr: string | null;
  is_featured: boolean;
  sort_order: number;
  speakers:
    | {
        first_name: string;
        last_name: string;
        photo_url: string | null;
        title_en: string | null;
        title_de: string | null;
        title_fr: string | null;
      }
    | Array<{
        first_name: string;
        last_name: string;
        photo_url: string | null;
        title_en: string | null;
        title_de: string | null;
        title_fr: string | null;
      }>
    | null;
}

/**
 * Sends the "ask a speaker a question" prompt email for one order.
 *
 * Idempotent via `orders.ask_speaker_email_sent_at` — second call is a no-op
 * unless `force: true`. Bails when the order isn't paid/comped, when the
 * event is already past, or when the order has no tickets to attach a
 * link token to.
 *
 * Used from two places:
 *   - `/api/cron/ask-speakers-prompts` for the normal "1 day after purchase
 *     and at least 2 days before event" window.
 *   - The Stripe webhook for the late-purchase branch (purchase 48–72h
 *     before event), so we still respect the "no later than 2 days before"
 *     upper bound.
 */
export async function sendAskSpeakersPromptForOrder(
  supabase: SupabaseClient,
  orderId: string,
  options: { force?: boolean } = {}
): Promise<{ sent: boolean; reason?: string }> {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, event_id, status, recipient_email, recipient_name, locale, ask_speaker_email_sent_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { sent: false, reason: "order_not_found" };
  }

  if (order.status !== "paid" && order.status !== "comped") {
    return { sent: false, reason: "order_not_paid" };
  }

  if (order.ask_speaker_email_sent_at && !options.force) {
    return { sent: false, reason: "already_sent" };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at")
    .eq("id", order.event_id)
    .maybeSingle();

  if (!event) {
    return { sent: false, reason: "event_not_found" };
  }

  if (new Date(event.starts_at).getTime() <= Date.now()) {
    return { sent: false, reason: "event_past" };
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("ticket_token")
    .eq("order_id", orderId)
    .limit(1);

  const firstTicket = tickets?.[0];
  if (!firstTicket?.ticket_token) {
    return { sent: false, reason: "no_tickets" };
  }

  const locale = (order.locale as "en" | "de" | "fr") ?? "en";
  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  // Featured speakers (with a fallback to the full assignment list when
  // no-one is flagged is_featured) so the email always shows a face.
  const { data: featuredJoins } = await supabase
    .from("event_speakers")
    .select(
      "role_label_en, role_label_de, role_label_fr, is_featured, sort_order, speakers ( first_name, last_name, photo_url, title_en, title_de, title_fr )"
    )
    .eq("event_id", event.id)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(5);

  let joins: SpeakerJoinRow[] = (featuredJoins ?? []) as SpeakerJoinRow[];
  if (joins.length === 0) {
    const { data: anyJoins } = await supabase
      .from("event_speakers")
      .select(
        "role_label_en, role_label_de, role_label_fr, is_featured, sort_order, speakers ( first_name, last_name, photo_url, title_en, title_de, title_fr )"
      )
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })
      .limit(5);
    joins = (anyJoins ?? []) as SpeakerJoinRow[];
  }

  const speakers = joins.flatMap((row) => {
    const sp = Array.isArray(row.speakers) ? row.speakers[0] : row.speakers;
    if (!sp) return [];
    const roleLabel =
      (row[`role_label_${locale}` as keyof typeof row] as string | null) ||
      row.role_label_en ||
      (sp[`title_${locale}` as keyof typeof sp] as string | null) ||
      sp.title_en ||
      "";
    return [
      {
        name: `${sp.first_name} ${sp.last_name}`.trim(),
        roleLabel: roleLabel || undefined,
        photoUrl: sp.photo_url ?? null,
      },
    ];
  });

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

  try {
    const result = await sendAskSpeakersEmail({
      to: order.recipient_email,
      recipientName: order.recipient_name ?? "",
      eventTitle,
      ticketToken: firstTicket.ticket_token,
      speakers,
      locale,
      ticketsBaseUrl,
    });

    await supabase
      .from("orders")
      .update({ ask_speaker_email_sent_at: new Date().toISOString() })
      .eq("id", orderId);

    await supabase.from("audit_log").insert({
      action: "ask_speakers_prompt_sent",
      entity_type: "orders",
      entity_id: orderId,
      details: {
        event_id: event.id,
        resend_message_id: result.id || null,
      },
    });

    return { sent: true };
  } catch (err) {
    captureServerError(err, {
      scope: "send_ask_speakers_prompt",
      data: { order_id: orderId, event_id: event.id },
    });
    return { sent: false, reason: "send_failed" };
  }
}
