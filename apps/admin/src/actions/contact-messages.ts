"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendStaffMessage } from "@dbc/email";
import { revalidatePath } from "next/cache";

export interface ContactMessageInput {
  contactId: string;
  subject: string;
  body: string;
  /** Per-template pool inbox (sponsors@ / press@ / speakers@) or operator override.
   *  Takes precedence over the operator's profile email AND is used as the
   *  From address itself so the recipient sees the department mailbox directly. */
  replyTo?: string | null;
  locale?: "en" | "de" | "fr";
  /** Outreach-template slug if this message was composed from a template.
   *  Logged into contact_messages.template_slug for the per-contact timeline.
   *  NULL = free-form send. */
  templateSlug?: string | null;
}

/**
 * Map a pool inbox local-part (sponsors@ / press@ / speakers@) to the human
 * department label shown in the email From header — "Jay Kalala · Sponsorships".
 * Returns empty string for generic mailboxes (info@, hello@) so we don't
 * decorate the sender with a meaningless suffix.
 */
function departmentForPool(emailAddress: string | null | undefined): string {
  if (!emailAddress) return "";
  const local = emailAddress.split("@")[0]?.toLowerCase() ?? "";
  switch (local) {
    case "sponsors":
      return "Sponsorships";
    case "press":
      return "Press";
    case "speakers":
      return "Speakers";
    default:
      return "";
  }
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
    .select("first_name, last_name, display_name")
    .eq("id", user.userId)
    .single();

  // Fall back through display_name → first+last → "DBC Germany Team". The
  // profiles table has no full_name column — pre-fix this returned null and
  // every staff send rendered as "DBC Germany Team" instead of the operator.
  const senderName =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "DBC Germany Team";
  const senderEmail =
    process.env.RESEND_STAFF_FROM_ADDRESS ?? "team@dbc-germany.com";
  // Reply-To preference: explicit per-template pool inbox (e.g. sponsors@)
  // → operator's own email (auth user) → senderEmail fallback.
  const replyTo = input.replyTo ?? user.email ?? senderEmail;
  const locale = input.locale ?? "en";

  // When a per-template pool inbox is provided (sponsors@/press@/speakers@),
  // use it as BOTH the From address and the Reply-To. Same-domain From+ReplyTo
  // is the cleanest deliverability signal (Gmail penalises misaligned ones).
  // Plus we show the department label after the sender name so the recipient
  // sees who-and-from-where in one glance: "Jay Kalala · Sponsorships".
  const isPoolReplyTo =
    !!input.replyTo &&
    /^(sponsors|press|speakers)@/i.test(input.replyTo.trim());
  const fromAddress = isPoolReplyTo ? input.replyTo!.trim() : undefined;
  const fromDepartment = isPoolReplyTo
    ? departmentForPool(input.replyTo)
    : "";

  let resendMessageId: string | null = null;
  try {
    const res = await sendStaffMessage({
      to: contact.email,
      subject,
      body,
      senderName,
      senderEmail,
      replyTo,
      fromAddress,
      fromDepartment: fromDepartment || undefined,
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
    template_slug: input.templateSlug ?? null,
  });

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "send_contact_message",
    entity_type: "contacts",
    entity_id: contact.id,
    details: {
      subject,
      resend_message_id: resendMessageId,
      template_slug: input.templateSlug ?? null,
    },
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
