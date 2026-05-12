"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createInvitation } from "@/actions/invitations";
import { createEmailClient, fromAddressFor } from "@dbc/email";

type Status = "active" | "pending_approval" | "rejected" | "revoked";

async function sendChapterDelegateOutcomeEmail(
  to: string,
  recipientName: string,
  eventTitle: string,
  outcome: "rejected" | "revoked",
  note: string | null,
  ccLeadEmail: string | null
) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = createEmailClient();
    const subject =
      outcome === "rejected"
        ? `Deine DBC-Anmeldung für ${eventTitle}`
        : `Status: Deine DBC-Anmeldung für ${eventTitle}`;
    const body =
      outcome === "rejected"
        ? `Hallo ${recipientName},\n\n` +
          `wir konnten deine Anmeldung als Chapter-Delegierte:r für ${eventTitle} aktuell nicht bestätigen.\n` +
          (note ? `\nHinweis: ${note}\n` : "") +
          `\nFalls das nicht erwartet war, sprich bitte mit deiner/deinem Sektions-Botschafter:in oder antworte direkt auf diese E-Mail.\n\nViele Grüße\nDas DBC Germany Team\n` +
          `\n---\n\n` +
          `Hi ${recipientName},\n\n` +
          `we couldn't confirm your chapter-delegate registration for ${eventTitle}.\n` +
          (note ? `\nNote: ${note}\n` : "") +
          `\nIf this wasn't expected, please reach out to your Chapter Ambassador or reply to this email.\n\nThanks,\nThe DBC Germany Team\n`
        : `Hallo ${recipientName},\n\n` +
          `dein Team-Ticket für ${eventTitle} wurde widerrufen. Falls das ein Versehen war, melde dich bitte direkt bei uns.\n\nViele Grüße\nDas DBC Germany Team\n` +
          `\n---\n\n` +
          `Hi ${recipientName},\n\n` +
          `your team ticket for ${eventTitle} has been revoked. If this wasn't expected, please get in touch.\n\nThanks,\nThe DBC Germany Team\n`;
    const cc = ccLeadEmail ? [ccLeadEmail] : undefined;
    await resend.emails.send({
      from: fromAddressFor("transactional"),
      to,
      cc,
      subject,
      text: body,
    });
  } catch (err) {
    console.error(`[chapterDelegate.${outcome}] email failed:`, err);
  }
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ChapterDelegateRow {
  involvementId: string;
  contactId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  position: string | null;
  chapterCountry: string | null;
  status: Status;
  eventId: string;
  eventTitle: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewerEmail: string | null;
  reviewNote: string | null;
  chapterLeadName: string | null;
  chapterLeadEmail: string | null;
  submissionIp: string | null;
  companion: {
    involvementId: string;
    contactId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string;
    status: Status;
  } | null;
}

interface ListFilters {
  status?: Status | "all";
  eventId?: string | null;
  chapter?: string | null;
  search?: string | null;
}

export async function listChapterDelegates(
  filters: ListFilters = {}
): Promise<ChapterDelegateRow[]> {
  await requireRole("admin");
  const service = getServiceClient();
  const status = filters.status ?? "pending_approval";

  // PGRST201 disambiguation: contacts has TWO FKs from
  // contact_event_involvements (contact_id + companion_contact_id), so we
  // have to spell the relationship out explicitly when embedding.
  let query = service
    .from("contact_event_involvements")
    .select(
      `id, contact_id, event_id, role, status, chapter_country, chapter_position,
       chapter_lead_name, chapter_lead_email, submission_ip,
       review_note, reviewed_at, reviewed_by,
       companion_contact_id, created_at,
       events:events(id, title_en, title_de, title_fr),
       contacts:contacts!contact_event_involvements_contact_id_fkey(id, email, first_name, last_name)`
    )
    .eq("role", "chapter_delegate")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (filters.eventId) query = query.eq("event_id", filters.eventId);
  if (filters.chapter) query = query.eq("chapter_country", filters.chapter);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    contact_id: string;
    event_id: string;
    status: Status;
    chapter_country: string | null;
    chapter_position: string | null;
    chapter_lead_name: string | null;
    chapter_lead_email: string | null;
    submission_ip: string | null;
    review_note: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    companion_contact_id: string | null;
    created_at: string;
    events: { id: string; title_en: string; title_de: string; title_fr: string } | null;
    contacts: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }>;

  const reviewerIds = Array.from(
    new Set(rows.map((r) => r.reviewed_by).filter((v): v is string => !!v))
  );
  const reviewerEmailById = new Map<string, string>();
  for (const id of reviewerIds) {
    const { data: u } = await service.auth.admin.getUserById(id);
    if (u.user?.email) reviewerEmailById.set(id, u.user.email);
  }

  const companionContactIds = Array.from(
    new Set(
      rows.map((r) => r.companion_contact_id).filter((v): v is string => !!v)
    )
  );
  const companionContactsById = new Map<
    string,
    {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
    }
  >();
  if (companionContactIds.length > 0) {
    const { data: companions } = await service
      .from("contacts")
      .select("id, email, first_name, last_name")
      .in("id", companionContactIds);
    for (const c of companions ?? []) companionContactsById.set(c.id, c);
  }
  const companionInvolvementByContact = new Map<
    string,
    { id: string; status: Status }
  >();
  if (companionContactIds.length > 0) {
    const eventIds = Array.from(new Set(rows.map((r) => r.event_id)));
    const { data: companionInvolvements } = await service
      .from("contact_event_involvements")
      .select("id, contact_id, event_id, status")
      .eq("role", "delegate_companion")
      .in("contact_id", companionContactIds)
      .in("event_id", eventIds);
    for (const c of companionInvolvements ?? []) {
      companionInvolvementByContact.set(c.contact_id, {
        id: c.id,
        status: c.status as Status,
      });
    }
  }

  let result = rows.map((r) => {
    const contact = r.contacts;
    const event = r.events;
    const eventTitle =
      event?.title_en ?? event?.title_de ?? event?.title_fr ?? "—";
    const displayName = contact
      ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
        contact.email
      : "—";
    let companion: ChapterDelegateRow["companion"] = null;
    if (r.companion_contact_id) {
      const c = companionContactsById.get(r.companion_contact_id);
      const inv = companionInvolvementByContact.get(r.companion_contact_id);
      if (c) {
        companion = {
          involvementId: inv?.id ?? "",
          contactId: c.id,
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          displayName:
            [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
          status: inv?.status ?? "pending_approval",
        };
      }
    }
    return {
      involvementId: r.id,
      contactId: r.contact_id,
      email: contact?.email ?? "",
      firstName: contact?.first_name ?? null,
      lastName: contact?.last_name ?? null,
      displayName,
      position: r.chapter_position,
      chapterCountry: r.chapter_country,
      status: r.status,
      eventId: r.event_id,
      eventTitle,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
      reviewerEmail: r.reviewed_by
        ? (reviewerEmailById.get(r.reviewed_by) ?? null)
        : null,
      reviewNote: r.review_note,
      chapterLeadName: r.chapter_lead_name,
      chapterLeadEmail: r.chapter_lead_email,
      submissionIp: r.submission_ip,
      companion,
    } satisfies ChapterDelegateRow;
  });

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.email.toLowerCase().includes(needle) ||
        r.displayName.toLowerCase().includes(needle) ||
        (r.position ?? "").toLowerCase().includes(needle)
    );
  }
  return result;
}

export async function approveChapterDelegate(
  involvementId: string,
  locale: string
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();

  const { data: inv } = await service
    .from("contact_event_involvements")
    .select(
      `id, contact_id, event_id, status, chapter_country, chapter_position,
       chapter_lead_email, companion_contact_id,
       contacts:contacts!contact_event_involvements_contact_id_fkey(id, email, first_name, last_name)`
    )
    .eq("id", involvementId)
    .eq("role", "chapter_delegate")
    .maybeSingle();
  if (!inv) return { error: "Delegate not found." };
  if (inv.status !== "pending_approval") {
    return { error: `Delegate is already ${inv.status}.` };
  }

  const { data: event } = await service
    .from("events")
    .select("chapter_delegate_tier_id, chapter_companion_tier_id, slug")
    .eq("id", inv.event_id)
    .single();
  if (!event?.chapter_delegate_tier_id) {
    return {
      error: "Chapter delegate tier not configured on this event.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contact = (inv as any).contacts as {
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  if (!contact) return { error: "Delegate contact missing." };

  // Issue delegate ticket. We use the formal invitation flow ("with_letter")
  // because:
  //   1. createInvitation appends the catering URL to customBody only in that mode
  //   2. external-chapter delegates are honored guests — a branded letter fits
  const chapterLabel = inv.chapter_country
    ? ` (Chapter: ${inv.chapter_country})`
    : "";
  const delegateResult = await createInvitation({
    eventId: inv.event_id,
    tierId: event.chapter_delegate_tier_id,
    firstName: contact.first_name ?? "",
    lastName: contact.last_name ?? "",
    email: contact.email,
    country: inv.chapter_country ?? undefined,
    locale,
    sendEmail: true,
    deliveryMode: "ticket_with_letter",
    acquisitionType: "invited",
    customBody: `Du bist als Team-Mitglied${chapterLabel} registriert. Bitte bringe dein Ticket zum Einlass mit.`,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((delegateResult as any).error) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: `Couldn't issue delegate ticket: ${(delegateResult as any).error}`,
    };
  }

  let companionTicketIssued = false;
  if (inv.companion_contact_id && event.chapter_companion_tier_id) {
    const { data: companion } = await service
      .from("contacts")
      .select("email, first_name, last_name")
      .eq("id", inv.companion_contact_id)
      .single();
    if (companion) {
      const compRes = await createInvitation({
        eventId: inv.event_id,
        tierId: event.chapter_companion_tier_id,
        firstName: companion.first_name ?? "",
        lastName: companion.last_name ?? "",
        email: companion.email,
        country: inv.chapter_country ?? undefined,
        locale,
        sendEmail: true,
        deliveryMode: "ticket_only",
        acquisitionType: "invited",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(compRes as any).error) companionTicketIssued = true;
    }
  }

  // Flip involvement rows to active.
  const nowIso = new Date().toISOString();
  await service
    .from("contact_event_involvements")
    .update({
      status: "active",
      reviewed_by: actor.userId,
      reviewed_at: nowIso,
    })
    .eq("id", inv.id);
  if (inv.companion_contact_id) {
    await service
      .from("contact_event_involvements")
      .update({
        status: companionTicketIssued ? "active" : "rejected",
        reviewed_by: actor.userId,
        reviewed_at: nowIso,
        review_note: companionTicketIssued ? null : "Companion ticket failed to issue.",
      })
      .eq("role", "delegate_companion")
      .eq("contact_id", inv.companion_contact_id)
      .eq("event_id", inv.event_id);
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "approve_chapter_delegate",
    entity_type: "contact_event_involvements",
    entity_id: inv.id,
    details: {
      event_id: inv.event_id,
      contact_email: contact.email,
      companion_issued: companionTicketIssued,
    },
  });

  // If the delegate gave us their chapter lead's email on the form, drop the
  // lead a short courtesy note so they know we approved their team member.
  if (inv.chapter_lead_email && process.env.RESEND_API_KEY) {
    try {
      const { data: eventRow } = await service
        .from("events")
        .select("title_en, title_de, title_fr")
        .eq("id", inv.event_id)
        .maybeSingle();
      const eventTitle =
        ((eventRow?.[`title_${locale}` as keyof typeof eventRow] as string) ||
          eventRow?.title_en) ?? "the event";
      const recipientName =
        [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
        contact.email;
      const resend = createEmailClient();
      await resend.emails.send({
        from: fromAddressFor("transactional"),
        to: inv.chapter_lead_email,
        subject: `Confirmed: ${recipientName} for ${eventTitle}`,
        text:
          `Hi,\n\n` +
          `${recipientName} (${contact.email}) was approved as a chapter delegate for ${eventTitle}.\n` +
          (companionTicketIssued ? `Their +1 companion was also confirmed.\n` : "") +
          `\nThanks,\nThe DBC Germany Team\n`,
      });
    } catch (err) {
      console.error("[approveChapterDelegate] lead-cc email failed:", err);
    }
  }

  revalidatePath(`/${locale}/chapter-delegates`);
  return { success: true };
}

export async function rejectChapterDelegate(
  involvementId: string,
  locale: string,
  note?: string
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  const { data: inv } = await service
    .from("contact_event_involvements")
    .select(
      "id, contact_id, event_id, status, companion_contact_id, chapter_lead_email"
    )
    .eq("id", involvementId)
    .eq("role", "chapter_delegate")
    .maybeSingle();
  if (!inv) return { error: "Delegate not found." };
  if (inv.status !== "pending_approval") {
    return { error: `Delegate is already ${inv.status}.` };
  }
  const nowIso = new Date().toISOString();
  await service
    .from("contact_event_involvements")
    .update({
      status: "rejected",
      reviewed_by: actor.userId,
      reviewed_at: nowIso,
      review_note: note?.trim() || null,
    })
    .eq("id", inv.id);
  if (inv.companion_contact_id) {
    await service
      .from("contact_event_involvements")
      .update({
        status: "rejected",
        reviewed_by: actor.userId,
        reviewed_at: nowIso,
        review_note: note?.trim() || null,
      })
      .eq("role", "delegate_companion")
      .eq("contact_id", inv.companion_contact_id)
      .eq("event_id", inv.event_id);
  }
  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "reject_chapter_delegate",
    entity_type: "contact_event_involvements",
    entity_id: inv.id,
    details: { note },
  });

  // Notify the delegate + their chapter lead (if provided on the form).
  const { data: contact } = await service
    .from("contacts")
    .select("email, first_name, last_name")
    .eq("id", inv.contact_id)
    .maybeSingle();
  const { data: event } = await service
    .from("events")
    .select("title_en, title_de, title_fr")
    .eq("id", inv.event_id)
    .maybeSingle();
  if (contact?.email && event) {
    const eventTitle =
      ((event[`title_${locale}` as keyof typeof event] as string) ||
        event.title_en) ?? "";
    const recipientName =
      [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
      contact.email.split("@")[0];
    await sendChapterDelegateOutcomeEmail(
      contact.email,
      recipientName,
      eventTitle,
      "rejected",
      note?.trim() || null,
      inv.chapter_lead_email
    );
  }

  revalidatePath(`/${locale}/chapter-delegates`);
  return { success: true };
}

export async function revokeChapterDelegate(
  involvementId: string,
  locale: string
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  const { data: inv } = await service
    .from("contact_event_involvements")
    .select(
      "id, contact_id, event_id, status, companion_contact_id, chapter_lead_email"
    )
    .eq("id", involvementId)
    .eq("role", "chapter_delegate")
    .maybeSingle();
  if (!inv) return { error: "Delegate not found." };
  if (inv.status === "rejected" || inv.status === "revoked") {
    return { error: `Delegate is already ${inv.status}.` };
  }
  const nowIso = new Date().toISOString();
  // Revoke any active tickets for delegate + companion under this event.
  const contactIds = [inv.contact_id];
  if (inv.companion_contact_id) contactIds.push(inv.companion_contact_id);
  const { data: orders } = await service
    .from("orders")
    .select("id, contact_id")
    .eq("event_id", inv.event_id)
    .in("contact_id", contactIds);
  const orderIds = (orders ?? []).map((o) => o.id);
  if (orderIds.length > 0) {
    await service
      .from("tickets")
      .update({
        revoked_at: nowIso,
        revoked_by: actor.userId,
        revocation_reason: "Chapter delegate revoked",
      })
      .in("order_id", orderIds);
  }
  await service
    .from("contact_event_involvements")
    .update({
      status: "revoked",
      reviewed_by: actor.userId,
      reviewed_at: nowIso,
    })
    .eq("id", inv.id);
  if (inv.companion_contact_id) {
    await service
      .from("contact_event_involvements")
      .update({
        status: "revoked",
        reviewed_by: actor.userId,
        reviewed_at: nowIso,
      })
      .eq("role", "delegate_companion")
      .eq("contact_id", inv.companion_contact_id)
      .eq("event_id", inv.event_id);
  }
  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "revoke_chapter_delegate",
    entity_type: "contact_event_involvements",
    entity_id: inv.id,
  });

  // Notify delegate (and their lead if known) so they're not surprised
  // at the door. Send to the companion too if there was one.
  const { data: contactRows } = await service
    .from("contacts")
    .select("id, email, first_name, last_name")
    .in(
      "id",
      [inv.contact_id, inv.companion_contact_id].filter(
        (v): v is string => !!v
      )
    );
  const { data: event } = await service
    .from("events")
    .select("title_en, title_de, title_fr")
    .eq("id", inv.event_id)
    .maybeSingle();
  if (contactRows && event) {
    const eventTitle =
      ((event[`title_${locale}` as keyof typeof event] as string) ||
        event.title_en) ?? "";
    for (const c of contactRows) {
      if (!c.email) continue;
      const recipientName =
        [c.first_name, c.last_name].filter(Boolean).join(" ") ||
        c.email.split("@")[0];
      await sendChapterDelegateOutcomeEmail(
        c.email,
        recipientName,
        eventTitle,
        "revoked",
        null,
        c.id === inv.contact_id ? inv.chapter_lead_email : null
      );
    }
  }

  revalidatePath(`/${locale}/chapter-delegates`);
  return { success: true };
}

export async function bulkApproveChapterDelegates(
  involvementIds: string[],
  locale: string
) {
  await requireRole("admin");
  const results = await Promise.all(
    involvementIds.map((id) => approveChapterDelegate(id, locale))
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const succeeded = results.filter((r) => !(r as any).error).length;
  return {
    success: true,
    approved: succeeded,
    failed: results.length - succeeded,
  };
}

export async function bulkRejectChapterDelegates(
  involvementIds: string[],
  locale: string,
  note?: string
) {
  await requireRole("admin");
  const results = await Promise.all(
    involvementIds.map((id) => rejectChapterDelegate(id, locale, note))
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const succeeded = results.filter((r) => !(r as any).error).length;
  return {
    success: true,
    rejected: succeeded,
    failed: results.length - succeeded,
  };
}

export async function listChapterDelegateEvents() {
  await requireRole("admin");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, slug, title_en, title_de, title_fr, starts_at")
    .gte("ends_at", new Date(Date.now() - 86400000 * 30).toISOString())
    .order("starts_at", { ascending: true });
  return data ?? [];
}

/**
 * Admin-only: create a chapter delegate (and optionally their companion)
 * directly. Bypasses the approval queue — the admin is the trust signal.
 * Tickets and emails go out immediately, same shape as approveChapterDelegate.
 */
export async function createChapterDelegateManually(formData: FormData) {
  const actor = await requireRole("admin");
  const service = getServiceClient();

  const eventId = ((formData.get("event_id") as string) ?? "").trim();
  const locale = ((formData.get("locale") as string) ?? "en").trim();
  const firstName = ((formData.get("first_name") as string) ?? "").trim();
  const lastName = ((formData.get("last_name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const position = ((formData.get("position") as string) ?? "").trim();
  const chapter = ((formData.get("chapter_country") as string) ?? "")
    .trim()
    .toUpperCase();
  const leadName = ((formData.get("chapter_lead_name") as string) ?? "").trim() || null;
  const leadEmail =
    ((formData.get("chapter_lead_email") as string) ?? "").trim().toLowerCase() ||
    null;

  if (!eventId) return { error: "Missing event." };
  if (!firstName || !lastName || !email || !position || !chapter) {
    return { error: "Please fill in name, email, position and chapter." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address." };
  }

  const bringsCompanion = formData.get("brings_companion") === "true";
  let companion: {
    firstName: string;
    lastName: string;
    email: string;
  } | null = null;
  if (bringsCompanion) {
    const cfn = ((formData.get("companion_first_name") as string) ?? "").trim();
    const cln = ((formData.get("companion_last_name") as string) ?? "").trim();
    const cem = ((formData.get("companion_email") as string) ?? "")
      .trim()
      .toLowerCase();
    if (!cfn || !cln || !cem) {
      return {
        error: "Complete the companion's details, or untick the +1.",
      };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cem)) {
      return { error: "Invalid companion email." };
    }
    if (cem === email) {
      return { error: "Companion email must differ from delegate's." };
    }
    companion = { firstName: cfn, lastName: cln, email: cem };
  }

  // Read tier wiring + program-enabled flag from the event row.
  const { data: event } = await service
    .from("events")
    .select(
      "id, chapter_delegate_tier_id, chapter_companion_tier_id, chapter_delegate_program_enabled, title_en, title_de, title_fr, slug"
    )
    .eq("id", eventId)
    .single();
  if (!event) return { error: "Event not found." };
  if (!event.chapter_delegate_tier_id) {
    return {
      error:
        "Chapter delegate tier isn't configured on this event. Edit event settings first.",
    };
  }

  // Upsert contacts (reuses the existing RPC the public form uses — SSOT).
  // Signature: (p_email, p_first_name, p_last_name, p_country, p_birthday,
  // p_gender, p_occupation, p_auto_category_slug, p_extra_category_slugs).
  // No p_phone param exists on this RPC.
  const { data: delegateContactId, error: dcErr } = await service.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_country: chapter,
      p_extra_category_slugs: ["invited_guests"],
    }
  );
  if (dcErr || !delegateContactId) {
    return {
      error:
        dcErr?.message ?? "Couldn't upsert delegate contact.",
    };
  }

  let companionContactId: string | null = null;
  if (companion) {
    const { data: cId, error: cErr } = await service.rpc(
      "upsert_contact_from_checkout",
      {
        p_email: companion.email,
        p_first_name: companion.firstName,
        p_last_name: companion.lastName,
        p_country: chapter,
        p_extra_category_slugs: ["invited_guests"],
      }
    );
    if (cErr) {
      console.error(
        "[createChapterDelegateManually] companion upsert failed:",
        cErr
      );
    }
    companionContactId = cId ?? null;
  }

  // Insert involvement rows in active status — admin is the trust signal,
  // so we skip the pending_approval gate the public form uses.
  const nowIso = new Date().toISOString();
  const { data: delegateInvolvement, error: insErr } = await service
    .from("contact_event_involvements")
    .insert({
      contact_id: delegateContactId,
      event_id: eventId,
      role: "chapter_delegate",
      status: "active",
      chapter_country: chapter,
      chapter_position: position,
      companion_contact_id: companionContactId,
      submission_metadata: { created_by_admin: actor.userId },
      chapter_lead_email: leadEmail,
      chapter_lead_name: leadName,
      reviewed_by: actor.userId,
      reviewed_at: nowIso,
    })
    .select("id")
    .single();
  if (insErr || !delegateInvolvement) {
    return {
      error:
        insErr?.message ?? "Couldn't create delegate involvement record.",
    };
  }
  if (companionContactId) {
    await service.from("contact_event_involvements").insert({
      contact_id: companionContactId,
      event_id: eventId,
      role: "delegate_companion",
      status: "active",
      chapter_country: chapter,
      submission_metadata: {
        created_by_admin: actor.userId,
        delegate_involvement_id: delegateInvolvement.id,
      },
      reviewed_by: actor.userId,
      reviewed_at: nowIso,
    });
  }

  // Issue delegate ticket via the existing createInvitation flow (reuses
  // ticket reservation, contact tagging, ticket-with-letter email + catering
  // URL injection). Same shape as approveChapterDelegate so behaviour is
  // identical regardless of whether the registration came in via the public
  // form or the admin form.
  const chapterLabelSuffix = chapter ? ` (Chapter: ${chapter})` : "";
  const delegateRes = await createInvitation({
    eventId,
    tierId: event.chapter_delegate_tier_id,
    firstName,
    lastName,
    email,
    country: chapter,
    locale,
    sendEmail: true,
    deliveryMode: "ticket_with_letter",
    acquisitionType: "invited",
    customBody: `Du bist als Team-Mitglied${chapterLabelSuffix} registriert. Bitte bringe dein Ticket zum Einlass mit.`,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((delegateRes as any).error) {
    return {
      error:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Delegate created in DB but ticket issuance failed: ${(delegateRes as any).error}`,
    };
  }

  let companionTicketIssued = false;
  if (companion && event.chapter_companion_tier_id) {
    const compRes = await createInvitation({
      eventId,
      tierId: event.chapter_companion_tier_id,
      firstName: companion.firstName,
      lastName: companion.lastName,
      email: companion.email,
      country: chapter,
      locale,
      sendEmail: true,
      deliveryMode: "ticket_only",
      acquisitionType: "invited",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(compRes as any).error) companionTicketIssued = true;
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "create_chapter_delegate_manual",
    entity_type: "contact_event_involvements",
    entity_id: delegateInvolvement.id,
    details: {
      event_id: eventId,
      email,
      chapter,
      companion_issued: companionTicketIssued,
    },
  });

  revalidatePath(`/${locale}/chapter-delegates`);
  return { success: true, companionIssued: companionTicketIssued };
}
