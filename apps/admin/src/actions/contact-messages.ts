"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendStaffMessage } from "@dbc/email";
import { revalidatePath } from "next/cache";

export interface ContactMessageAttachment {
  /** Supabase Storage object key inside the `contact-mail-attachments` bucket. */
  path: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

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
  /** Uploaded attachments. Each `path` must already exist in the
   *  `contact-mail-attachments` bucket (the compose dialog uploads via the
   *  signed-URL helper below before submitting). */
  attachments?: ContactMessageAttachment[];
}

const ATTACHMENT_BUCKET = "contact-mail-attachments";
// Resend caps a single email at 40 MB total (sum of all attachments + body).
const ATTACHMENT_MAX_BYTES_PER_FILE = 40 * 1024 * 1024;
const ATTACHMENT_MAX_BYTES_TOTAL = 40 * 1024 * 1024;
// Allowlist of content types the composer accepts. Kept broad enough to cover
// typical business attachments (docs, sheets, slides, images, archives) while
// still refusing anything obviously executable.
const ATTACHMENT_ALLOWED_CONTENT_TYPES = new Set<string>([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "text/plain",
  "text/csv",
]);

/**
 * Mints a Supabase signed upload URL so the compose dialog can stream a file
 * directly into the private `contact-mail-attachments` bucket, bypassing the
 * Vercel 4.5 MB serverless payload cap. After the upload finishes the
 * browser passes the returned `path` back to `sendContactMessage` which
 * downloads the bytes server-side and hands them to Resend.
 */
export async function createContactMessageAttachmentUploadUrl(input: {
  contactId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}) {
  await requireRole("team_member");
  const { contactId, filename, contentType, sizeBytes } = input;

  if (!contactId || !/^[0-9a-f-]{32,40}$/i.test(contactId)) {
    return { error: "Invalid contact id" };
  }
  if (!ATTACHMENT_ALLOWED_CONTENT_TYPES.has(contentType)) {
    return {
      error: "Unsupported file type. Please attach a document, image, or archive.",
    };
  }
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > ATTACHMENT_MAX_BYTES_PER_FILE
  ) {
    return { error: "File must be between 1 byte and 40 MB" };
  }

  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120) || "attachment";
  const path = `${contactId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${safeName}`;

  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return {
      error: `Could not create upload URL: ${error?.message ?? "unknown"}`,
    };
  }
  return {
    success: true as const,
    path,
    token: data.token,
  };
}

/**
 * Removes a previously uploaded attachment, e.g. when the operator clicks the
 * "remove" button before pressing Send. Server-only; never trusts the
 * supplied path to be outside the bucket.
 */
export async function deleteContactMessageAttachment(path: string) {
  await requireRole("team_member");
  if (!path || typeof path !== "string") {
    return { error: "Invalid attachment path" };
  }
  const supabase = await createServerClient();
  const { error } = await supabase.storage.from(ATTACHMENT_BUCKET).remove([path]);
  if (error) {
    return { error: `Could not delete attachment: ${error.message}` };
  }
  return { success: true as const };
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

  // Server-side defence in depth: even if the client UI somehow allows more,
  // refuse to forward anything past Resend's hard 40 MB ceiling. The client
  // already enforces both per-file and total caps before upload.
  const attachmentsMeta = input.attachments ?? [];
  if (attachmentsMeta.length > 0) {
    const total = attachmentsMeta.reduce((n, a) => n + (a.sizeBytes || 0), 0);
    if (total > ATTACHMENT_MAX_BYTES_TOTAL) {
      return {
        error: `Attachments exceed 40 MB total (${(total / 1024 / 1024).toFixed(1)} MB). Resend rejects messages above this size.`,
      };
    }
    for (const att of attachmentsMeta) {
      if (att.sizeBytes > ATTACHMENT_MAX_BYTES_PER_FILE) {
        return { error: `Attachment "${att.filename}" exceeds 40 MB.` };
      }
      if (!ATTACHMENT_ALLOWED_CONTENT_TYPES.has(att.contentType)) {
        return { error: `Attachment "${att.filename}" has an unsupported file type.` };
      }
    }
  }

  // Pull each uploaded blob server-side and hand the Buffer straight to Resend.
  // Files stay in storage after sending so the audit trail + re-send flow work.
  const resendAttachments: Array<{ filename: string; content: Buffer }> = [];
  for (const att of attachmentsMeta) {
    const { data: blob, error: dlErr } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .download(att.path);
    if (dlErr || !blob) {
      return {
        error: `Could not load attachment "${att.filename}": ${dlErr?.message ?? "missing"}`,
      };
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    resendAttachments.push({ filename: att.filename, content: buf });
  }

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
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });
    resendMessageId = res.id ?? null;
  } catch (err) {
    return {
      error: `Could not send email: ${(err as Error).message}`,
    };
  }

  const attachmentsForRow = attachmentsMeta.map((a) => ({
    path: a.path,
    filename: a.filename,
    content_type: a.contentType,
    size_bytes: a.sizeBytes,
  }));

  await supabase.from("contact_messages").insert({
    contact_id: contact.id,
    sent_by: user.userId,
    subject,
    body_md: body,
    reply_to: replyTo,
    resend_message_id: resendMessageId,
    template_slug: input.templateSlug ?? null,
    attachments: attachmentsForRow,
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
      attachment_count: attachmentsForRow.length,
      attachment_total_bytes: attachmentsForRow.reduce(
        (n, a) => n + (a.size_bytes || 0),
        0
      ),
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
      "id, subject, body_md, sent_at, sent_by, resend_message_id, template_slug, reply_to, profiles:profiles!contact_messages_sent_by_fkey(display_name, first_name, last_name)"
    )
    .eq("contact_id", contactId)
    .order("sent_at", { ascending: false });

  // Compose a display name with the same fallback chain the send action
  // uses (display_name → first+last → fallback), so the timeline + send path
  // never disagree about who sent a given message.
  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (row as any).profiles as
      | { display_name: string | null; first_name: string | null; last_name: string | null }
      | null;
    const senderName =
      p?.display_name?.trim() ||
      [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() ||
      "DBC Germany Team";
    return { ...row, senderName };
  });
}
