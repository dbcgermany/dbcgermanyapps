"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendStaffMessage } from "@dbc/email";
import { revalidatePath } from "next/cache";

export interface ContactMessageInput {
  contactId: string;
  subject: string;
  body: string;
  replyTo?: string | null;
  locale?: "en" | "de" | "fr";
}

export async function sendContactMessage(input: ContactMessageInput) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) return { error: "Subject is required." };
  if (!body) return { error: "Message body is required." };

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name")
    .eq("id", input.contactId)
    .single();
  if (!contact) return { error: "Contact not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.userId)
    .single();

  const senderName = profile?.full_name ?? "DBC Germany Team";
  const senderEmail =
    process.env.RESEND_STAFF_FROM_ADDRESS ?? "team@dbc-germany.com";
  const replyTo = input.replyTo ?? profile?.email ?? senderEmail;
  const locale = input.locale ?? "en";

  let resendMessageId: string | null = null;
  try {
    const res = await sendStaffMessage({
      to: contact.email,
      subject,
      body,
      senderName,
      senderEmail,
      replyTo,
      locale,
    });
    resendMessageId = res.id ?? null;
  } catch (err) {
    return {
      error: `Could not send email: ${(err as Error).message}`,
    };
  }

  await supabase.from("contact_messages").insert({
    contact_id: contact.id,
    sent_by: user.userId,
    subject,
    body_md: body,
    reply_to: replyTo,
    resend_message_id: resendMessageId,
  });

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "send_contact_message",
    entity_type: "contacts",
    entity_id: contact.id,
    details: { subject, resend_message_id: resendMessageId },
  });

  revalidatePath(`/[locale]/contacts/${contact.id}`, "layout");
  return { success: true };
}

export async function listContactMessages(contactId: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("contact_messages")
    .select(
      "id, subject, body_md, sent_at, sent_by, profiles:profiles!contact_messages_sent_by_fkey(full_name)"
    )
    .eq("contact_id", contactId)
    .order("sent_at", { ascending: false });
  return data ?? [];
}
