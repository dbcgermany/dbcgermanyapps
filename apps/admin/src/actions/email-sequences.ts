"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendAftercareSequence } from "@dbc/email";
import { revalidatePath } from "next/cache";

const SEQUENCE_COLUMNS =
  "id, event_id, delay_days, subject_en, subject_de, subject_fr, body_en, body_de, body_fr, is_active, sort_order, sent_at" as const;

export async function getEmailSequences(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_email_sequences")
    .select(SEQUENCE_COLUMNS)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createEmailSequence(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const subjectEn = formData.get("subject_en") as string;
  const bodyEn = formData.get("body_en") as string;

  const seqData = {
    event_id: eventId,
    delay_days: parseInt(formData.get("delay_days") as string, 10),
    subject_en: subjectEn,
    subject_de: (formData.get("subject_de") as string) || subjectEn,
    subject_fr: (formData.get("subject_fr") as string) || subjectEn,
    body_en: bodyEn,
    body_de: (formData.get("body_de") as string) || bodyEn,
    body_fr: (formData.get("body_fr") as string) || bodyEn,
    is_active: true,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  };

  if (isNaN(seqData.delay_days) || seqData.delay_days < 0) {
    return { error: "delay_days must be a non-negative integer" };
  }

  const { data, error } = await supabase
    .from("event_email_sequences")
    .insert(seqData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_email_sequence",
    entity_type: "event_email_sequences",
    entity_id: data.id,
    details: { event_id: eventId, delay_days: seqData.delay_days },
  });

  revalidatePath(`/${locale}/events/${eventId}/emails`);
  return { success: true };
}

export async function updateEmailSequence(
  sequenceId: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const subjectEn = formData.get("subject_en") as string;
  const bodyEn = formData.get("body_en") as string;

  const delayDays = parseInt(formData.get("delay_days") as string, 10);
  if (isNaN(delayDays) || delayDays < 0) {
    return { error: "delay_days must be a non-negative integer" };
  }

  const seqData = {
    delay_days: delayDays,
    subject_en: subjectEn,
    subject_de: (formData.get("subject_de") as string) || subjectEn,
    subject_fr: (formData.get("subject_fr") as string) || subjectEn,
    body_en: bodyEn,
    body_de: (formData.get("body_de") as string) || bodyEn,
    body_fr: (formData.get("body_fr") as string) || bodyEn,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  };

  const { error } = await supabase
    .from("event_email_sequences")
    .update(seqData)
    .eq("id", sequenceId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_email_sequence",
    entity_type: "event_email_sequences",
    entity_id: sequenceId,
    details: { event_id: eventId, delay_days: delayDays },
  });

  revalidatePath(`/${locale}/events/${eventId}/emails`);
  return { success: true };
}

export async function deleteEmailSequence(
  sequenceId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_email_sequences")
    .delete()
    .eq("id", sequenceId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_email_sequence",
    entity_type: "event_email_sequences",
    entity_id: sequenceId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/emails`);
  return { success: true };
}

/**
 * Dispatches a single email sequence NOW (manual trigger for admin preview/resend).
 * Also used by the cron job in apps/tickets/src/app/api/cron/email-sequences/route.ts
 * via the shared dispatch logic.
 *
 * Sends the sequence email to every attendee of the event, then stamps sent_at.
 * Idempotent: skips sequences that already have sent_at set.
 */
export async function dispatchEmailSequence(
  sequenceId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  // Fetch the sequence
  const { data: seq } = await supabase
    .from("event_email_sequences")
    .select(SEQUENCE_COLUMNS)
    .eq("id", sequenceId)
    .single();

  if (!seq) return { error: "Sequence not found" };
  if (seq.sent_at) return { error: "Sequence has already been sent" };

  // Fetch all attendees of the event (distinct by email)
  const { data: tickets } = await supabase
    .from("tickets")
    .select("attendee_name, attendee_email")
    .eq("event_id", eventId);

  if (!tickets || tickets.length === 0) {
    return { error: "No attendees to send to" };
  }

  // Deduplicate by email (attendee_email might repeat across tickets)
  const recipientMap = new Map<string, string>();
  for (const ticket of tickets) {
    if (!recipientMap.has(ticket.attendee_email)) {
      recipientMap.set(ticket.attendee_email, ticket.attendee_name);
    }
  }

  // Fetch event to get the attendee's preferred locale via their order
  // Simple approach: send in the event's first available locale variant per recipient.
  // For correctness, we'd need to join orders; for now we send each attendee the
  // sequence variant matching their order locale via the orders table.
  const { data: orders } = await supabase
    .from("orders")
    .select("recipient_email, locale")
    .eq("event_id", eventId);

  const localeByEmail = new Map<string, "en" | "de" | "fr">();
  for (const order of orders ?? []) {
    localeByEmail.set(
      order.recipient_email,
      (order.locale as "en" | "de" | "fr") || "en"
    );
  }

  // Fetch the event for title (per-locale) and slug (for the gallery link).
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title_en, title_de, title_fr")
    .eq("id", eventId)
    .single();

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  let sent = 0;
  let failed = 0;

  for (const [email, name] of recipientMap) {
    const recipientLocale = localeByEmail.get(email) ?? "en";
    const subject =
      (seq[`subject_${recipientLocale}` as keyof typeof seq] as string) ||
      seq.subject_en;
    const bodyTemplate =
      (seq[`body_${recipientLocale}` as keyof typeof seq] as string) ||
      seq.body_en;
    const body = bodyTemplate
      .replace(/\{name\}/g, name)
      .replace(/\{event\}/g, event ? (
        (event[`title_${recipientLocale}` as keyof typeof event] as string) ||
        event.title_en
      ) : "");

    const eventTitle = event
      ? ((event[
          `title_${recipientLocale}` as keyof typeof event
        ] as string) || event.title_en)
      : "";

    const galleryUrl = event
      ? `${ticketsBaseUrl}/${recipientLocale}/events/${event.slug}/gallery`
      : undefined;

    try {
      await sendAftercareSequence({
        to: email,
        subject,
        body,
        eventTitle,
        galleryUrl,
        locale: recipientLocale,
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error("Failed to send sequence email:", err);
    }
  }

  // Mark as sent
  await supabase
    .from("event_email_sequences")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", sequenceId);

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "dispatch_email_sequence",
    entity_type: "event_email_sequences",
    entity_id: sequenceId,
    details: { event_id: eventId, sent, failed },
  });

  revalidatePath(`/${locale}/events/${eventId}/emails`);
  return { success: true, sent, failed };
}
