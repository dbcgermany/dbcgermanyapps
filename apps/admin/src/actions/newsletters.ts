"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  DEFAULT_FROM,
  getResendDomainStatus,
  sendNewsletterEmail,
  type UpcomingEvent,
} from "@dbc/email";
import { revalidatePath } from "next/cache";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbc-germany.com";
const TICKETS_URL =
  process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
const RESEND_ACCOUNT_OWNER_EMAIL = "dbcgermany@gmail.com";

type Locale = "en" | "de" | "fr";

function normalizeLocale(v: string | null | undefined): Locale {
  return v === "de" || v === "fr" ? v : "en";
}

/**
 * Fetches the next upcoming published event for the given locale so every
 * newsletter carries a branded announcement of the next show. Returns
 * undefined if nothing is scheduled — the template renders no hero in
 * that case.
 */
async function getUpcomingEventForNewsletter(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  locale: Locale
): Promise<UpcomingEvent | undefined> {
  const { data } = await supabase
    .from("events")
    .select(
      "slug, title_en, title_de, title_fr, starts_at, venue_name, city"
    )
    .eq("is_published", true)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const title =
    (locale === "de" && row.title_de) ||
    (locale === "fr" && row.title_fr) ||
    row.title_en;

  return {
    title,
    startsAtIso: row.starts_at,
    venueName: row.venue_name ?? "",
    city: row.city ?? undefined,
    ticketUrl: `${TICKETS_URL}/${locale}/events/${row.slug}`,
  };
}

export interface NewsletterDraft {
  id?: string;
  subject: string;
  preheader: string | null;
  body_mdx: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  locale: string;
  target_category_slugs: string[];
  exclude_category_slugs: string[];
}

export async function listNewsletters() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("newsletters")
    .select(
      "id, subject, status, locale, scheduled_for, sent_at, recipients_count, opens_count, clicks_count, unsubscribes_count, created_at"
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getNewsletter(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function saveNewsletter(draft: NewsletterDraft) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const row = {
    subject: draft.subject.trim(),
    preheader: draft.preheader?.trim() || null,
    body_mdx: draft.body_mdx,
    from_name: draft.from_name.trim() || "DBC Germany",
    from_email: draft.from_email.trim() || "newsletter@dbc-germany.com",
    reply_to: draft.reply_to?.trim() || null,
    locale: draft.locale,
    target_category_slugs: draft.target_category_slugs ?? [],
    exclude_category_slugs: draft.exclude_category_slugs ?? [],
  };

  if (!row.subject) return { error: "Subject is required." };

  if (draft.id) {
    const { error } = await supabase
      .from("newsletters")
      .update(row)
      .eq("id", draft.id)
      .eq("status", "draft");
    if (error) return { error: error.message };
    revalidatePath("/[locale]/newsletters", "layout");
    return { success: true, id: draft.id };
  }

  const { data, error } = await supabase
    .from("newsletters")
    .insert({ ...row, status: "draft", created_by: user.userId })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Insert failed" };
  revalidatePath("/[locale]/newsletters", "layout");
  return { success: true, id: data.id };
}

export async function previewNewsletterRecipientCount(
  targetSlugs: string[],
  excludeSlugs: string[]
): Promise<number> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("count_newsletter_recipients", {
    p_target_slugs: targetSlugs,
    p_exclude_slugs: excludeSlugs,
  });
  return (data as number) ?? 0;
}

export async function getNewsletterSenderDomainStatus() {
  await requireRole("manager");
  return getResendDomainStatus();
}

export async function listContactCategories() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("contact_categories")
    .select("id, slug, name_en, name_de, name_fr, color")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

async function resolveRecipients(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  targetSlugs: string[],
  excludeSlugs: string[]
): Promise<
  Array<{ id: string; email: string; unsubscribe_token: string }>
> {
  const { data: targetCats } =
    targetSlugs.length > 0
      ? await supabase
          .from("contact_categories")
          .select("id")
          .in("slug", targetSlugs)
      : { data: [] as Array<{ id: string }> };
  const { data: excludeCats } =
    excludeSlugs.length > 0
      ? await supabase
          .from("contact_categories")
          .select("id")
          .in("slug", excludeSlugs)
      : { data: [] as Array<{ id: string }> };

  const targetIds = (targetCats ?? []).map((c) => c.id);
  const excludeIds = (excludeCats ?? []).map((c) => c.id);

  let includeContactIds: Set<string> | null = null;
  if (targetIds.length > 0) {
    const { data: inc } = await supabase
      .from("contact_category_links")
      .select("contact_id")
      .in("category_id", targetIds);
    includeContactIds = new Set((inc ?? []).map((r) => r.contact_id));
  }

  let excludeContactIds = new Set<string>();
  if (excludeIds.length > 0) {
    const { data: exc } = await supabase
      .from("contact_category_links")
      .select("contact_id")
      .in("category_id", excludeIds);
    excludeContactIds = new Set((exc ?? []).map((r) => r.contact_id));
  }

  const { data: eligible } = await supabase
    .from("contacts")
    .select("id, email, unsubscribe_token")
    .eq("marketing_consent", true)
    .is("unsubscribed_at", null);

  return (eligible ?? []).filter(
    (c) =>
      (includeContactIds === null || includeContactIds.has(c.id)) &&
      !excludeContactIds.has(c.id)
  );
}

export async function sendTestNewsletter(id: string, toEmail: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data: nl } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();
  if (!nl) return { error: "Newsletter not found." };

  // If the Resend domain isn't verified yet, Resend rejects any send from a
  // @dbc-germany.com address. Fall back to the account-owner-only
  // `onboarding@resend.dev` sender so the template is still previewable —
  // Resend permits that sender, but only delivers it to the Resend account
  // owner's inbox. For any other recipient we have to block and tell them.
  const domain = await getResendDomainStatus();
  let fromName = nl.from_name;
  let fromEmail = nl.from_email;
  let subject = `[TEST] ${nl.subject}`;
  if (!domain.verified) {
    if (toEmail.trim().toLowerCase() !== RESEND_ACCOUNT_OWNER_EMAIL) {
      return {
        error: `${domain.message} Test sends to other recipients are blocked until the domain is verified. You can still test-send to ${RESEND_ACCOUNT_OWNER_EMAIL}.`,
      };
    }
    // Strip the explicit from so sendNewsletterEmail() uses DEFAULT_FROM.
    fromName = undefined as unknown as string;
    fromEmail = undefined as unknown as string;
    subject = `[TEST · unverified domain] ${nl.subject}`;
  }

  const locale = normalizeLocale(nl.locale);
  const upcomingEvent = await getUpcomingEventForNewsletter(supabase, locale);

  try {
    await sendNewsletterEmail({
      to: toEmail,
      subject,
      preheader: nl.preheader ?? undefined,
      body: nl.body_mdx,
      unsubscribeUrl: `${SITE_URL}/${locale}/newsletter/unsubscribe?token=preview`,
      fromName,
      fromEmail,
      replyTo: nl.reply_to ?? undefined,
      locale,
      upcomingEvent,
    });
    return {
      success: true,
      usedFallbackSender: !domain.verified,
      fallbackSender: !domain.verified ? DEFAULT_FROM : undefined,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function sendNewsletter(id: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: nl } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();
  if (!nl) return { error: "Newsletter not found." };
  if (nl.status !== "draft") {
    return { error: `Cannot send from status "${nl.status}".` };
  }

  // Pre-flight: no point reserving + creating rows if Resend can't deliver.
  const domain = await getResendDomainStatus();
  if (!domain.verified) {
    return {
      error: `Cannot send broadcast: ${domain.message}`,
    };
  }

  // Claim: only flip to sending if still draft (prevents double-send)
  const { data: claimed } = await supabase
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (!claimed) return { error: "Already sending or sent." };

  const recipients = await resolveRecipients(
    supabase,
    nl.target_category_slugs ?? [],
    nl.exclude_category_slugs ?? []
  );
  const locale = normalizeLocale(nl.locale);
  const upcomingEvent = await getUpcomingEventForNewsletter(supabase, locale);

  let sent = 0;
  let failed = 0;

  // Pre-create all sends as `queued` AND return their ids so we can embed the
  // real newsletter_sends UUID in each recipient's unsubscribe URL. Without
  // this, the per-send unsubscribe parameter was a literal "{SEND_ID}" string
  // (Resend does not substitute template vars in URLs), so the site's
  // unsubscribe action could only unsub the contact but never mark the
  // specific send row — the unsubscribes_count never incremented per campaign.
  const sendIdByContact = new Map<string, string>();
  if (recipients.length > 0) {
    const sendRows = recipients.map((r) => ({
      newsletter_id: id,
      contact_id: r.id,
      email: r.email,
      status: "queued" as const,
    }));
    const { data: insertedRows } = await supabase
      .from("newsletter_sends")
      .insert(sendRows)
      .select("id, contact_id");
    for (const row of insertedRows ?? []) {
      if (row.contact_id) sendIdByContact.set(row.contact_id, row.id);
    }
  }

  // Batch of 20 parallel sends with a tiny delay to be polite to Resend's rate
  // limits (currently 10 rps on default plan; 20/100ms leaves headroom).
  const BATCH = 20;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const slice = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      slice.map(async (r) => {
        const sendId = sendIdByContact.get(r.id);
        const unsubscribeUrl = `${SITE_URL}/${locale}/newsletter/unsubscribe?token=${r.unsubscribe_token}${sendId ? `&send=${sendId}` : ""}`;
        const { id: resendId } = await sendNewsletterEmail({
          to: r.email,
          subject: nl.subject,
          preheader: nl.preheader ?? undefined,
          body: nl.body_mdx,
          unsubscribeUrl,
          fromName: nl.from_name,
          fromEmail: nl.from_email,
          replyTo: nl.reply_to ?? undefined,
          locale,
          upcomingEvent,
        });
        return { contactId: r.id, resendId };
      })
    );
    for (let j = 0; j < results.length; j++) {
      const res = results[j];
      const recipient = slice[j];
      if (res.status === "fulfilled") {
        sent++;
        await supabase
          .from("newsletter_sends")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            resend_message_id: res.value.resendId,
          })
          .eq("newsletter_id", id)
          .eq("contact_id", recipient.id);
      } else {
        failed++;
        await supabase
          .from("newsletter_sends")
          .update({
            status: "failed",
            error: (res.reason as Error)?.message?.slice(0, 500) ?? "unknown",
          })
          .eq("newsletter_id", id)
          .eq("contact_id", recipient.id);
      }
    }
    if (i + BATCH < recipients.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  await supabase
    .from("newsletters")
    .update({
      status: failed > 0 && sent === 0 ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      recipients_count: recipients.length,
    })
    .eq("id", id);

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "send_newsletter",
    entity_type: "newsletters",
    entity_id: id,
    details: { sent, failed, recipients: recipients.length },
  });

  revalidatePath("/[locale]/newsletters", "layout");
  return { success: true, sent, failed };
}

// ---------------------------------------------------------------------------
// Delivery analytics
// ---------------------------------------------------------------------------

export interface NewsletterStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  openRate: number;
  clickRate: number;
}

export async function getNewsletterStats(
  newsletterId: string
): Promise<NewsletterStats> {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data: sends } = await supabase
    .from("newsletter_sends")
    .select("status, opened_at, clicked_at, unsubscribed_at")
    .eq("newsletter_id", newsletterId);

  const totalSent = sends?.length ?? 0;
  let delivered = 0;
  let opened = 0;
  let clicked = 0;
  let unsubscribed = 0;
  let bounced = 0;

  for (const s of sends ?? []) {
    if (s.status === "failed" || s.status === "bounced") {
      bounced++;
    } else {
      delivered++;
    }
    if (s.opened_at) opened++;
    if (s.clicked_at) clicked++;
    if (s.unsubscribed_at) unsubscribed++;
  }

  return {
    totalSent,
    delivered,
    opened,
    clicked,
    unsubscribed,
    bounced,
    openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    clickRate: delivered > 0 ? Math.round((clicked / delivered) * 100) : 0,
  };
}
